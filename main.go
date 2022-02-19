package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
)

type Route struct {
	Uri       string
	ForwardTo []string
	Type      string
	Tags      []string
}

// getEnv get key environment variable if exist otherwise return defalutValue
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if len(value) == 0 {
		return defaultValue
	}
	return value
}

func dump(data interface{}) {
	b, _ := json.MarshalIndent(data, "", "  ")
	fmt.Println(string(b))
}

func forwardRequest(dest string, rawBody []byte, rqHeader http.Header) {

	req, reqErr := http.NewRequest("POST", dest, bytes.NewBuffer(rawBody))

	if reqErr != nil {
		fmt.Println("Error creating request client, SKIPPING handler...\n", reqErr)
		return
	}

	parsedUrl, parsedUrlErr := url.Parse(dest)

	if parsedUrlErr != nil {
		fmt.Println("Error parsing URL\n", parsedUrlErr)
	}

	req.Header = rqHeader
	req.Host = parsedUrl.Host

	client := http.Client{}

	res, err := client.Do(req)

	if err != nil {
		fmt.Printf("Error in HTTP request, URL: %v, err: %v\n", dest, err)
		return
	}

	if res.StatusCode != http.StatusOK {
		fmt.Printf("Error forwarding webhook, URL: %v, statusCode: %v\n", dest, res.Status)
		return
	}

	fmt.Printf("Webhook forwarded, dest: %v, Res: %v\n", dest, res.Status)
}

func main() {
	PORT := ":" + getEnv("PORT", "4500")
	// Read JSON configFile
	configFile, readConfigErr := os.ReadFile("config.json")

	if readConfigErr != nil {
		log.Fatal("Error reading config file\n", readConfigErr)
	}

	configDecoder := json.NewDecoder(strings.NewReader(string(configFile)))
	configDecoder.DisallowUnknownFields()

	// Decode JSON
	var config []Route
	parseConfigErr := configDecoder.Decode(&config)

	if parseConfigErr != nil {
		log.Fatal("Error parsing JSON config\n", parseConfigErr)
	}

	for _, currentConfig := range config {
		// Print all routes and multiplex destination
		fmt.Printf("URI is for : %v \n", currentConfig.Uri)

		fmt.Println("To forward to:")
		for _, forwardTo := range currentConfig.ForwardTo {
			fmt.Printf("-%v\n", forwardTo)
		}

		fmt.Println("Type:", currentConfig.Type)

		fmt.Println("Tags for this route:")
		for _, tag := range currentConfig.Tags {
			fmt.Printf("-%v\n", tag)
		}

		fmt.Println()

		forwardTo := currentConfig.ForwardTo
		channelType := currentConfig.Type

		http.HandleFunc(currentConfig.Uri, func(rw http.ResponseWriter, r *http.Request) {
			fmt.Println("-----NEW REQUEST-----")
			fmt.Println("URL:", r.URL)

			// Check request for validation
			switch {
			// Handle fb messenger validation
			// /fb-prod?hub.mode=subscribe&hub.challenge=1386454042&hub.verify_token=abc123
			case channelType == "fb":
				qs := r.URL.Query()
				if qs.Get("hub.mode") == "subscribe" {
					rw.Write([]byte(qs.Get("hub.challenge")))
					return
				}
			}

			rqHeader := r.Header

			// Print webhook headers
			fmt.Println("---Headers---")
			for headerKey, keyContent := range rqHeader {
				for _, headerValue := range keyContent {
					fmt.Println(headerKey, ":", headerValue)
				}
			}

			// Print webhook body
			fmt.Println("---Body---")
			var webhookBody interface{}

			rawBody, errReadingRawBody := ioutil.ReadAll(r.Body)

			if errReadingRawBody != nil {
				fmt.Println("Error reading webhook body\n", errReadingRawBody)
			}

			json.Unmarshal(rawBody, &webhookBody)

			dump(webhookBody)

			fmt.Println("---Forwarding---")
			// Forward request to their destination
			for _, dest := range forwardTo {

				go forwardRequest(dest, rawBody, rqHeader)

			}

			rw.Write([]byte("Ok"))
		})

	}

	fmt.Println("Listening on port", PORT)
	httpErr := http.ListenAndServe(PORT, nil)

	if httpErr != nil {
		log.Fatal("Server error\n", httpErr)
	}
}
