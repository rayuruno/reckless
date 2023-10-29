package main

import (
	"context"
	"log"
	"net/http"
	"path/filepath"
	"strings"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
	"github.com/rayuruno/reckless/internal/opts"
	"github.com/rayuruno/reckless/internal/stream"
)

func serveTLS(addr, certFile, keyFile string, recorder stream.Recorder) {
	http.HandleFunc("/", corsHandler(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
	}))

	http.HandleFunc("/record/", corsHandler(authHandler(recordHandler("/record/", recorder))))

	if err := http.ListenAndServeTLS(addr, certFile, keyFile, nil); err != nil {
		log.Fatal(err)
	}
}
func serve(addr string, recorder stream.Recorder) {
	http.HandleFunc("/", corsHandler(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
	}))

	http.HandleFunc("/record/", corsHandler(authHandler(recordHandler("/record/", recorder))))

	if err := http.ListenAndServe(addr, nil); err != nil {
		log.Fatal(err)
	}
}

func corsHandler(h http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "X-Token")

		if r.Method == http.MethodOptions || r.Method == http.MethodHead {
			return
		}
		h(w, r)
	}
}

type cKey string

const kToken cKey = "token"

func authHandler(h http.HandlerFunc) http.HandlerFunc {
	app, err := firebase.NewApp(context.Background(), nil, opts.Options()...)
	if err != nil {
		log.Fatalf("error initializing app: %v\n", err)
	}

	client, err := app.Auth(context.Background())
	if err != nil {
		log.Fatalf("error getting Auth client: %v\n", err)
	}

	return func(w http.ResponseWriter, r *http.Request) {
		token, err := client.VerifyIDToken(r.Context(), r.Header.Get("X-Token"))
		if err != nil {
			w.WriteHeader(403)
			return
		}
		h(w, r.WithContext(context.WithValue(r.Context(), kToken, token)))
	}
}

func recordHandler(pathPrefix string, recorder stream.Recorder) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			w.WriteHeader(404)
			return
		}
		token, ok := r.Context().Value(kToken).(*auth.Token)
		if !ok {
			w.WriteHeader(403)
			return
		}

		info, err := stream.ParseStreamInfo(filepath.Join(token.UID, strings.TrimPrefix(r.URL.Path, pathPrefix)))
		if err != nil {
			w.WriteHeader(400)
			return
		}

		if err := recorder.Record(info, r.Body); err != nil {
			log.Println("[recorder.Record()]", err)
			w.WriteHeader(412)
		}
	}
}
