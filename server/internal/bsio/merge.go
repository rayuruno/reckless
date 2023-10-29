package bsio

import (
	"errors"
	"io"
	"os"
)

func Merge(h *os.File, b *os.File, d *os.File) (err error) {
	_, err1 := h.Seek(0, io.SeekStart)
	_, err2 := b.Seek(0, io.SeekStart)
	_, err3 := d.ReadFrom(h)
	_, err4 := d.ReadFrom(b)
	err = errors.Join(err1, err2, err3, err4)
	return
}

// func newContainer() *wContainer {
// 	h := new(wContainer)
// 	h.Segment.SeekHead = &webm.SeekHead{
// 		Seek: []webm.Seek{
// 			{
// 				SeekID:       ebml.ElementInfo.Bytes(),
// 				SeekPosition: 0,
// 			},
// 			{
// 				SeekID:       ebml.ElementTracks.Bytes(),
// 				SeekPosition: 0,
// 			},
// 			{
// 				SeekID:       ebml.ElementCues.Bytes(),
// 				SeekPosition: 0,
// 			},
// 		},
// 	}
// 	h.Segment.Cues = &webm.Cues{
// 		CuePoint: []webm.CuePoint{},
// 	}
// 	return h
// }

// type wContainer struct {
// 	Header  webm.EBMLHeader `ebml:"EBML"`
// 	Segment wSegment        `ebml:"Segment,size=unknown"`
// }
// type wSegment struct {
// 	SeekHead *webm.SeekHead `ebml:"SeekHead"`
// 	Info     webm.Info      `ebml:"Info"`
// 	Tracks   webm.Tracks    `ebml:"Tracks"`
// 	Cues     *webm.Cues     `ebml:"Cues"`
// 	Cluster  []webm.Cluster `ebml:"Cluster,size=unknown"`
// }
