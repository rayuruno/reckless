package opts

import (
	"os"

	"google.golang.org/api/option"
)

func WithCredentialsFile() option.ClientOption {
	v, ok := os.LookupEnv("GOOGLE_APPLICATION_CREDENTIALS")
	if !ok {
		return nil
	}
	return option.WithCredentialsFile(v)
}

func Options() []option.ClientOption {
	op := WithCredentialsFile()
	if op != nil {
		return []option.ClientOption{op}
	}
	return nil
}
