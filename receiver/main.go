package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"time"
)

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

func main() {

	PORT := ":" + getEnv("PORT", "4501")

	http.HandleFunc("/", func(rw http.ResponseWriter, r *http.Request) {

		rqHeader := r.Header
		fmt.Println(time.Now().String())
		fmt.Println("---Headers---")
		for headerKey, keyContent := range rqHeader {
			for _, headerValue := range keyContent {
				fmt.Println(headerKey, ":", headerValue)
			}
		}
		fmt.Println("Host", r.Host)

		// Print webhook body
		fmt.Println("---Body---")
		var webhookBody interface{}

		rawBody, errReadingRawBody := ioutil.ReadAll(r.Body)

		if errReadingRawBody != nil {
			fmt.Println("Error reading webhook body\n", errReadingRawBody)
		}

		json.Unmarshal(rawBody, &webhookBody)

		dump(webhookBody)

		rw.Write([]byte("Ok received"))
	})

	fmt.Println("Listening on port", PORT)
	err := http.ListenAndServe(PORT, nil)

	if err != nil {
		log.Fatal(err)
	}
}
