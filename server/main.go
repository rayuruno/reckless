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
	addr := flag.String("addr", ":9000", "http server listen addr")
	certFile := flag.String("certFile", "certs/localhost/cert.pem", "cert file")
	keyFile := flag.String("keyFile", "certs/localhost/key.pem", "key file")
	streamsDir := flag.String("streamsDir", "", "streams dir")
	streamsBucket := flag.String("streamsBucket", "", "streams bucket")
	flag.Parse()

	var recorder stream.Recorder
	switch {
	case *streamsDir != "":
		recorder = stream.FileRecorder(*streamsDir)
	case *streamsBucket != "":
		recorder = stream.NewGcsRecorder(*streamsBucket)
	}

	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)

	go serveTLS(*addr, *certFile, *keyFile, recorder)

	log.Println("server started")

	<-sig

	log.Println("server stopped", recorder.Close())
}
