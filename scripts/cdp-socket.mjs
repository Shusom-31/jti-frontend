// A small bounded CDP socket for local browser checks (no external dependency).
import { connect } from 'node:net';
import { randomBytes } from 'node:crypto';
export function connectCdpSocket(address) {
  return new Promise((resolve, reject) => {
    const url = new URL(address);
    const transport = connect(Number(url.port), url.hostname);
    let buffer = Buffer.alloc(0), upgraded = false;
    const client = { readyState: 0, onmessage: null, onclose: null, send, close: () => transport.end() };
    const timer = setTimeout(() => { transport.destroy(); reject(new Error('CDP socket connection timed out.')); }, 10000);
    transport.on('error', reject);
    transport.on('close', () => { client.readyState = 3; client.onclose?.(); clearTimeout(timer); });
    transport.on('connect', () => transport.write(`GET ${url.pathname}${url.search} HTTP/1.1\r\nHost: ${url.host}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: ${randomBytes(16).toString('base64')}\r\nSec-WebSocket-Version: 13\r\n\r\n`));
    transport.on('data', chunk => {
      buffer = Buffer.concat([buffer, chunk]);
      if (!upgraded) {
        const boundary = buffer.indexOf('\r\n\r\n');
        if (boundary < 0) return;
        const response = buffer.subarray(0, boundary).toString();
        if (!response.startsWith('HTTP/1.1 101')) { reject(new Error('CDP socket upgrade failed.')); transport.destroy(); return; }
        buffer = buffer.subarray(boundary + 4); upgraded = true; client.readyState = 1; clearTimeout(timer); resolve(client);
      }
      while (buffer.length >= 2) {
        const opcode = buffer[0] & 15;
        let length = buffer[1] & 127, offset = 2;
        if (length === 126) { if (buffer.length < 4) return; length = buffer.readUInt16BE(2); offset = 4; }
        if (length === 127) { if (buffer.length < 10) return; const big = buffer.readBigUInt64BE(2); if (big > 16777216n) { transport.destroy(new Error('CDP frame exceeds the local check limit.')); return; } length = Number(big); offset = 10; }
        if (buffer.length < offset + length) return;
        const payload = buffer.subarray(offset, offset + length); buffer = buffer.subarray(offset + length);
        if (opcode === 1) client.onmessage?.({ data: payload.toString('utf8') });
        else if (opcode === 8) transport.end();
        else if (opcode === 9) send(payload, 10);
      }
    });
    function send(value, opcode = 1) {
      const data = Buffer.isBuffer(value) ? value : Buffer.from(value);
      const mask = randomBytes(4);
      const head = Buffer.alloc(data.length < 126 ? 2 : data.length <= 65535 ? 4 : 10);
      head[0] = 128 | opcode;
      if (data.length < 126) head[1] = 128 | data.length;
      else if (data.length <= 65535) { head[1] = 254; head.writeUInt16BE(data.length, 2); }
      else { head[1] = 255; head.writeBigUInt64BE(BigInt(data.length), 2); }
      const masked = Buffer.from(data);
      for (let i = 0; i < masked.length; i++) masked[i] ^= mask[i % 4];
      transport.write(Buffer.concat([head, mask, masked]));
    }
  });
}
