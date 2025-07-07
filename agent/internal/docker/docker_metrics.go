package docker

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/docker/docker/api/types"
)

func GetContainerStats() []map[string]interface{} {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	containers, err := dockerClient.ContainerList(ctx, types.ContainerListOptions{All: false})
	if err != nil {
		log.Printf("Failed to list running containers: %v", err)
		return nil
	}

	var stats []map[string]interface{}
	for _, container := range containers {
		containerStats, err := dockerClient.ContainerStats(ctx, container.ID, false)
		if err != nil {
			log.Printf("Failed to get stats for container %s: %v", container.ID, err)
			continue
		}
		defer containerStats.Body.Close()

		// Parse the stats
		var statsData types.Stats
		if err := json.NewDecoder(containerStats.Body).Decode(&statsData); err != nil {
			log.Printf("Failed to decode stats for container %s: %v", container.ID, err)
			continue
		}

		// Calculate CPU percentage
		cpuDelta := float64(statsData.CPUStats.CPUUsage.TotalUsage - statsData.PreCPUStats.CPUUsage.TotalUsage)
		systemDelta := float64(statsData.CPUStats.SystemUsage - statsData.PreCPUStats.SystemUsage)
		cpuPercent := 0.0
		if systemDelta > 0.0 && cpuDelta > 0.0 {
			cpuPercent = (cpuDelta / systemDelta) * float64(len(statsData.CPUStats.CPUUsage.PercpuUsage)) * 100.0
		}

		// Calculate memory usage
		memoryUsage := float64(statsData.MemoryStats.Usage)
		memoryLimit := float64(statsData.MemoryStats.Limit)
		memoryPercent := 0.0
		if memoryLimit > 0 {
			memoryPercent = (memoryUsage / memoryLimit) * 100.0
		}

		// Get network stats
		networkStats := make(map[string]interface{})
		for name, stats := range statsData.Networks {
			networkStats[name] = map[string]interface{}{
				"rx_bytes":   stats.RxBytes,
				"tx_bytes":   stats.TxBytes,
				"rx_packets": stats.RxPackets,
				"tx_packets": stats.TxPackets,
			}
		}

		containerName := container.ID[:12]
		if len(container.Names) > 0 {
			containerName = container.Names[0]
		}
		
		containerStat := map[string]interface{}{
			"id":             container.ID,
			"name":           containerName,
			"image":          container.Image,
			"status":         container.Status,
			"cpu_percent":    cpuPercent,
			"memory_usage":   memoryUsage,
			"memory_limit":   memoryLimit,
			"memory_percent": memoryPercent,
			"network":        networkStats,
		}
		stats = append(stats, containerStat)
	}

	return stats
}

func GetContainerLogs(containerID string, lines int) ([]string, error) {
	return StreamLogs(containerID, lines)
} 