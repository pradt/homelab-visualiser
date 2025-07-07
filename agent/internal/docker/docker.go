package docker

import (
	"context"
	"log"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/client"
)

var dockerClient *client.Client

func Initialize() {
	var err error
	dockerClient, err = client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		log.Fatalf("Failed to initialize Docker client: %v", err)
	}
	log.Println("Docker client initialized")
}

func Shutdown() {
	if dockerClient != nil {
		dockerClient.Close()
	}
}

func ListContainers() []map[string]interface{} {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	containers, err := dockerClient.ContainerList(ctx, types.ContainerListOptions{All: true})
	if err != nil {
		log.Printf("Failed to list Docker containers: %v", err)
		return nil
	}

	var result []map[string]interface{}
	for _, c := range containers {
		info := map[string]interface{}{
			"id":      c.ID,
			"names":   c.Names,
			"image":   c.Image,
			"status":  c.Status,
			"state":   c.State,
			"ports":   c.Ports,
			"created": c.Created,
		}
		result = append(result, info)
	}
	return result
}