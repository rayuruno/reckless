package stream

import (
	"io"
)

const suHead = "h"
const suBody = "b"

// stream recorder records http stream as media stream file to target location
// Close should finalize any remaining operation before process exits
type Recorder interface {
	Record(*StreamInfo, io.Reader) error
	Close() error
}
