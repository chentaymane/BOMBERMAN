# Character death recordings

Add actual MP3 files directly in this directory, using these names:

| Character | Filename |
| --- | --- |
| Allal | `allal.mp3` |
| Bualam | `bualam.mp3` |
| Cheb Larbi | `cheb-larbi.mp3` |
| Driss | `driss.mp3` |
| Mmi Na3ima | `mmi-na3ima.mp3` |
| Niba | `niba.mp3` |
| Nizar | `nizar.mp3` |
| San Du Khan | `san-du-khan.mp3` |
| Wldchinwya | `wldchinwya.mp3` |

Edit each roster entry's `sound` field in `characters.js` if you prefer different
filenames. Names, images and sound URLs are derived from this one roster.
Playback uses the real
recording, with no generated-tone fallback. Missing or invalid files stay silent
and can be retried on the next life loss. Successful downloads are decoded and
cached for subsequent deaths. Reload the page after replacing an already cached
recording. Use **Sound: on/off** below the board to mute.

The backend serves `.mp3` with `audio/mpeg`. Restart an already running backend
after installing this update. Adding recording files afterwards requires no
server-code change.
