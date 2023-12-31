package bsio

import (
	"errors"
	"io"
	"log"
	"time"

	"github.com/at-wat/ebml-go"
	"github.com/at-wat/ebml-go/webm"
)

// splits live media stream into header and segments
func Split(src io.Reader, hw io.Writer, bw io.Writer) (err error) {
	wh := new(wHeader)
	err = ebml.Unmarshal(src, wh, ebml.WithIgnoreUnknown(true))
	if err != nil && err != ebml.ErrReadStopped {
		return
	}
	err = Copy(bw, src)
	err = errors.Join(err, ebml.Marshal(wh, hw))
	return
}

func SplitRecording(startTime time.Time, src io.Reader, hw io.Writer, bw io.Writer) (err error) {
	wh := new(wHeader)
	wh.Segment.Info.DateUTC = startTime
	err = ebml.Unmarshal(src, wh, ebml.WithIgnoreUnknown(true))
	if err != nil && err != ebml.ErrReadStopped {
		return
	}
	err = Copy(bw, src)
	wh.Segment.Info.Duration = float64(time.Now().UTC().Sub(startTime).Milliseconds()) //float64(time.Since(wh.Segment.Info.DateUTC).Milliseconds())
	log.Println("wh.Segment.Info.Duration", wh.Segment.Info.Duration)
	err = errors.Join(err, ebml.Marshal(wh, hw))
	return
}

type wContainer struct {
	Header  webm.EBMLHeader `ebml:"EBML"`
	Segment wSegment        `ebml:"Segment"`
}
type wSegment struct {
	SeekHead *webm.SeekHead `ebml:"SeekHead"`
	Info     webm.Info      `ebml:"Info"`
	Tracks   webm.Tracks    `ebml:"Tracks"`
	Cues     *webm.Cues     `ebml:"Cues"`
	Cluster  []webm.Cluster `ebml:"Cluster"`
}
type wHeader struct {
	Header  webm.EBMLHeader `ebml:"EBML"`
	Segment struct {
		SeekHead webm.SeekHead `ebml:"SeekHead"`
		Info     webm.Info     `ebml:"Info"`
		Tracks   webm.Tracks   `ebml:"Tracks,stop"`
	} `ebml:"Segment,size=unknown"`
}
