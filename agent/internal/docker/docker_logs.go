package docker

import (
	"bufio"
	"context"
	"fmt"
	"github.com/docker/docker/api/types"
	"log"
	"time"
)

func StreamLogs(containerID string, lines int) ([]string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	options := types.ContainerLogsOptions{
		ShowStdout: true,
		ShowStderr: true,
		Tail:       fmt.Sprintf("%d", lines),
	}

	reader, err := dockerClient.ContainerLogs(ctx, containerID, options)
	if err != nil {
		return nil, fmt.Errorf("error fetching logs for %s: %w", containerID, err)
	}
	defer reader.Close()

	scanner := bufio.NewScanner(reader)
	var logs []string
	for scanner.Scan() {
		logs = append(logs, scanner.Text())
	}
	if err := scanner.Err(); err != nil {
		log.Printf("Error reading logs for container %s: %v", containerID, err)
	}

	return logs, nil
}

func GetAllContainerLogs(lines int) map[string][]string {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	containers, err := dockerClient.ContainerList(ctx, types.ContainerListOptions{All: false})
	if err != nil {
		log.Printf("Failed to list containers for logs: %v", err)
		return nil
	}

	allLogs := make(map[string][]string)
	for _, container := range containers {
		logs, err := StreamLogs(container.ID, lines)
		if err != nil {
			log.Printf("Failed to get logs for container %s: %v", container.ID, err)
			continue
		}
		
		containerName := container.ID[:12]
		if len(container.Names) > 0 {
			containerName = container.Names[0]
		}
		allLogs[containerName] = logs
	}

	return allLogs
}
