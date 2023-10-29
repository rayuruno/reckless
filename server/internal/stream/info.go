package stream

import (
	"fmt"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

type StreamInfo struct {
	name      string
	format    string
	startTime time.Time
}

func (info *StreamInfo) nameSuffix(s string) string {
	return strings.Replace(info.name, info.format, s+info.format, 1)
}

// relative duration! is best guess without expensive computation
// should only be used real time stream processing
func (info *StreamInfo) durationFrom(endTime time.Time) float64 {
	return float64(endTime.UTC().Sub(info.startTime).Milliseconds())
}

func (info *StreamInfo) contentType() string {
	switch info.format {
	case ".webm":
		return "video/webm"
	case ".mp4":
		return "video/mpeg4"
	}
	return "application/octet-stream"
}

func ParseStreamInfo(name string) (*StreamInfo, error) {
	startTime, err := parseStartTime(name)
	if err != nil {
		return nil, err
	}
	return &StreamInfo{name, filepath.Ext(name), startTime}, nil
}

func parseStartTime(name string) (time.Time, error) {
	return parseUnixTime(strings.TrimSuffix(filepath.Base(name), filepath.Ext(name)))
}

func parseUnixTime(input string) (t time.Time, err error) {
	timeInt, err := strconv.ParseInt(input, 10, 64)

	switch len(input) {
	case 13:
		// Convert to seconds if input is in millis.
		t = time.Unix(timeInt/1000, 0).UTC()
	case 10:
		t = time.Unix(timeInt, 0).UTC()
	default:
		err = fmt.Errorf("input has invalid length: %v", len(input))
	}

	return
}
