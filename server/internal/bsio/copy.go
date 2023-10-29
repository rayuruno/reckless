package bsio

import (
	"errors"
	"fmt"
	"io"
)

func Copy(dst io.Writer, src io.Reader) (err error) {
	_, err = io.Copy(dst, src)
	if isStreamError(err) {
		err = nil
	}
	return
}

// http2 stream error, to catch canceled streams (refreshed browser page...)
var sError = &streamError{}

func isStreamError(err error) bool {
	return errors.As(err, sError)
}

type streamErrCode uint32

type streamError struct {
	StreamID uint32
	Code     streamErrCode
	Cause    error
}

func (e streamError) Error() string {
	return fmt.Sprintf("ID %v, code %v", e.StreamID, e.Code)
}
