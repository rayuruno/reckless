package pool

import (
	"bufio"
	"bytes"
	"io"
	"sync"
)

var bb = sync.Pool{
	New: func() any {
		return new(bytes.Buffer)
	},
}

func GetBuffer() *bytes.Buffer {
	b := bb.Get().(*bytes.Buffer)
	b.Reset()
	return b
}
func PutBuffer(b any) {
	bb.Put(b)
}

var rp = sync.Pool{
	New: func() any {
		// The Pool's New function should generally only return pointer
		// types, since a pointer can be put into the return interface
		// value without an allocation:
		return bufio.NewReader(nil)
	},
}

func GetReader(r io.Reader) (src *bufio.Reader) {
	src = rp.Get().(*bufio.Reader)
	src.Reset(r)
	return
}
func PutReader(r any) {
	rp.Put(r)
}
