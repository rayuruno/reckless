package main

import (
	"flag"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/rayuruno/reckless/internal/stream"
)

func main() {
	addr := flag.String("addr", ":8080", "http server listen addr")
	tlscert := flag.String("tlscert", "", "tls cert file")
	tlskey := flag.String("tlskey", "", "tls key file")
	storageDir := flag.String("storageDir", "", "fs dir to save recordings")
	storageBucket := flag.String("storageBucket", "", "gcs bucket to save recordings")
	flag.Parse()

	port, ok := os.LookupEnv("PORT")
	if ok {
		*addr = ":" + port
	}

	var recorder stream.Recorder
	switch {
	case *storageDir != "":
		recorder = stream.FileRecorder(*storageDir)
	case *storageBucket != "":
		recorder = stream.NewGcsRecorder(*storageBucket)
	}

	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)

	if *tlscert == "" || *tlskey == "" {
		go serve(*addr, recorder)
	} else {
		go serveTLS(*addr, *tlscert, *tlskey, recorder)
	}

	log.Println("server started")

	<-sig

	log.Println("server stopped", recorder.Close())
}
