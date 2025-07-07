package metrics

import (
	"github.com/shirou/gopsutil/cpu"
	"github.com/shirou/gopsutil/disk"
	"github.com/shirou/gopsutil/host"
	"github.com/shirou/gopsutil/load"
	"github.com/shirou/gopsutil/mem"
	"github.com/shirou/gopsutil/net"
	"github.com/shirou/gopsutil/process"
	"log"
	"sort"
	"time"
)

func Initialize() {
	log.Println("System metrics initialized")
}

func CollectSystemStats() map[string]interface{} {
	stats := make(map[string]interface{})

	cpuPercents, _ := cpu.Percent(0, false)
	vmStat, _ := mem.VirtualMemory()
	diskStat, _ := disk.Usage("/")
	hostStat, _ := host.Info()
	loadStat, _ := load.Avg()
	netIO, _ := net.IOCounters(true)

	stats["cpu_percent"] = cpuPercents
	stats["memory_used"] = vmStat.Used / (1024 * 1024)
	stats["memory_total"] = vmStat.Total / (1024 * 1024)
	stats["disk_used"] = diskStat.Used / (1024 * 1024 * 1024)
	stats["disk_total"] = diskStat.Total / (1024 * 1024 * 1024)
	stats["uptime"] = hostStat.Uptime
	stats["load_avg"] = map[string]float64{
		"1m":  loadStat.Load1,
		"5m":  loadStat.Load5,
		"15m": loadStat.Load15,
	}

	netData := []map[string]interface{}{}
	for _, iface := range netIO {
		netData = append(netData, map[string]interface{}{
			"name":        iface.Name,
			"bytes_sent":  iface.BytesSent,
			"bytes_recv":  iface.BytesRecv,
			"packets_sent": iface.PacketsSent,
			"packets_recv": iface.PacketsRecv,
		})
	}
	stats["network"] = netData

	topProcs := getTopProcesses(5)
	stats["top_processes"] = topProcs

	return stats
}

func getTopProcesses(n int) []map[string]interface{} {
	procs, err := process.Processes()
	if err != nil {
		return nil
	}

	type procUsage struct {
		Name  string
		CPU   float64
		Mem   float32
		PID   int32
	}
	var usageList []procUsage

	for _, p := range procs {
		cpuPercent, _ := p.CPUPercent()
		memPercent, _ := p.MemoryPercent()
		name, _ := p.Name()
		if cpuPercent > 0 || memPercent > 0 {
			usageList = append(usageList, procUsage{
				Name: name, CPU: cpuPercent, Mem: memPercent, PID: p.Pid,
			})
		}
	}

	sort.Slice(usageList, func(i, j int) bool {
		return usageList[i].CPU > usageList[j].CPU
	})

	top := []map[string]interface{}{}
	for i := 0; i < len(usageList) && i < n; i++ {
		top = append(top, map[string]interface{}{
			"name": usageList[i].Name,
			"cpu":  usageList[i].CPU,
			"mem":  usageList[i].Mem,
			"pid":  usageList[i].PID,
		})
	}
	return top
}