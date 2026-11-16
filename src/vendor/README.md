# QR encoder

`qrcode.js` is the bundled ESM form of QRCode for JavaScript by Kazuhiko Arase,
from npm's installed `qrcode-terminal/vendor/QRCode` (qrcode-terminal 0.12.0).
Preserved licensing is in qrcode.LICENSE. Bundled with esbuild, no algorithm changes.

It encodes the ASCII receiving address entirely locally. No external QR service,
address upload, runtime script download, or new server endpoint is used.
Source: https://github.com/gtanner/qrcode-terminal/tree/master/vendor/QRCode
