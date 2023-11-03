package stream

import (
	"context"
	"errors"
	"io"
	"log"

	"cloud.google.com/go/storage"

	"github.com/rayuruno/reckless/internal/bsio"
	"github.com/rayuruno/reckless/internal/opts"
	"github.com/rayuruno/reckless/internal/pool"
)

var ctxb = context.Background()

type GcsRecorder struct {
	b string
	c *storage.Client
}

func NewGcsRecorder(b string) *GcsRecorder {
	c, err := storage.NewClient(ctxb, opts.Options()...)
	if err != nil {
		log.Fatal(err)
	}
	return &GcsRecorder{b: b, c: c}
}

func (s *GcsRecorder) Record(info *StreamInfo, src io.Reader) (err error) {
	rd := pool.GetReader(src)
	defer pool.PutReader(rd)

	if info.format != ".webm" {
		dst := s.newWriter(info.name)
		dst.ObjectAttrs.ContentType = info.contentType()
		err = errors.Join(bsio.Copy(dst, rd), dst.Close())
		return
	}

	ho := s.c.Bucket(s.b).Object(info.nameSuffix(suHead))
	hw := newWriterWithObject(ho)
	bo := s.c.Bucket(s.b).Object(info.nameSuffix(suBody))
	bw := newWriterWithObject(bo)
	err = errors.Join(bsio.SplitRecording(info.startTime, rd, hw, bw), hw.Close(), bw.Close())
	if err != nil {
		return

	}

	dst := s.c.Bucket(s.b).Object(info.name)
	com := dst.ComposerFrom(ho, bo)
	com.ObjectAttrs.ContentType = info.contentType()
	_, err = com.Run(ctxb)
	if err != nil {
		return
	}
	err = errors.Join(ho.Delete(ctxb), bo.Delete(ctxb))

	return nil
}

func (s *GcsRecorder) newWriter(name string) *storage.Writer {
	return newWriterWithObject(s.c.Bucket(s.b).Object(name))
}

func (s *GcsRecorder) Close() error {
	return s.c.Close()
}

func newWriterWithObject(o *storage.ObjectHandle) *storage.Writer {
	w := o.NewWriter(ctxb)
	w.ChunkSize = 0
	return w
}
