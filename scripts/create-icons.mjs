import { promises as fs } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const here = fileURLToPath(new URL('.', import.meta.url));
const iconDir = join(here, '..', 'src', 'assets', 'icons');
const base64Pixel = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/woAAm0BFxETCYYAAAAASUVORK5CYII=';
const icons = ['explore.png', 'meetups.png', 'profile.png', 'organizer.png'];

await fs.mkdir(iconDir, { recursive: true });
await Promise.all(
	icons.map((name) =>
		fs.writeFile(join(iconDir, name), Buffer.from(base64Pixel, 'base64'))
	)
);

console.log('Created placeholder icons. Replace them with the final artwork when available.');
