package stream

import (
	"io"
	"os"
	"path/filepath"

	"github.com/rayuruno/reckless/internal/bsio"
)

// stream recorder records http stream as media stream file to target location
// Close should finalize any remaining operation before process exits
type Recorder interface {
	Record(*StreamInfo, io.Reader) error
	Close() error
}

// file recorder copy stream body into a file inside fileRecorder directory
type FileRecorder string

func (dir FileRecorder) Record(info *StreamInfo, src io.Reader) (err error) {
	dst := mustOpenFile(string(dir), info.name, os.O_CREATE|os.O_RDWR)
	defer dst.Close()

	if info.format != ".webm" {
		err = bsio.Copy(dst, src)
		return
	}

	h := mustOpenFile(string(dir), info.nameSuffix("-h"), os.O_CREATE|os.O_RDWR)
	defer h.Close()
	b := mustOpenFile(string(dir), info.nameSuffix("-b"), os.O_CREATE|os.O_RDWR)
	defer b.Close()

	err = bsio.SplitRecording(info.startTime, src, h, b)
	if err != nil {
		return
	}
	err = bsio.Merge(h, b, dst)
	if err != nil {
		return
	}
	os.Remove(h.Name())
	os.Remove(b.Name())
	return
}

func (dir FileRecorder) Close() error {
	return nil
}

func mustOpenFile(dir, name string, flag int) *os.File {
	fname := filepath.Join(string(dir), name)
	if err := os.MkdirAll(filepath.Dir(fname), os.ModePerm); err != nil {
		panic(err)
	}

	file, _ := os.OpenFile(fname, flag, os.ModePerm)
	return file
}
