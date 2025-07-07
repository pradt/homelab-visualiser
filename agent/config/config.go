package config

import (
	"log"
	"os"
	"strings"
)

type Config struct {
	APIKey             string
	TLSEnabled         bool
	WhitelistedClients []string
	SocketPort         string
	CertFile           string
	KeyFile            string
}

func LoadConfig() Config {
	apiKey := os.Getenv("API_KEY")
	if apiKey == "" {
		log.Fatal("API_KEY environment variable is required")
	}

	tlsEnabled := os.Getenv("TLS_ENABLED") == "true"
	whitelistRaw := os.Getenv("WHITELISTED_CLIENTS")
	whitelist := []string{}
	if whitelistRaw != "" {
		whitelist = strings.Split(whitelistRaw, ",")
	}

	port := os.Getenv("SOCKET_PORT")
	if port == "" {
		port = "9000"
	}

	certFile := os.Getenv("TLS_CERT_FILE")
	keyFile := os.Getenv("TLS_KEY_FILE")

	return Config{
		APIKey:             apiKey,
		TLSEnabled:         tlsEnabled,
		WhitelistedClients: whitelist,
		SocketPort:         port,
		CertFile:           certFile,
		KeyFile:            keyFile,
	}
}
