import * as fse from "fs-extra";
import * as path from "path";
import * as request from "request";

interface VideoItem {
	name: string;
	link: {
		video: string;
		subtitle: string;
	};
}

const DIST_PATH = path.resolve(__dirname, "../data");

async function fetchFile(url: string, distPath: string) {
	const file = fse.createWriteStream(distPath);

	request
		.get({
			url,
			proxy: "http://127.0.0.1:8124"
		})
		.pipe(file)
		.on("finish", () => {
			file.close();
			console.log(`${distPath} done.`);
		})
		.on("error", () => {
			fse.unlink(distPath);
			console.log(`${url} download fail.`);
		});
}

export async function download(filename: string, folderName: string) {
	const content = await fse.readFile(path.join(DIST_PATH, filename), "utf8");
	const links = JSON.parse(content) as any[];

	const savePath = path.join(DIST_PATH, folderName);
	const videoPath = path.join(savePath, "video");
	const subtitlePath = path.join(savePath, "subtitle");

	await fse.ensureDir(videoPath);
	await fse.emptyDir(videoPath);
	await fse.ensureDir(subtitlePath);
	await fse.emptyDir(subtitlePath);

	links.forEach((week: any[], weekIndex: number) => {
		week.forEach((section: any[], sectionIndex: number) => {
			section.forEach((item: VideoItem, index: number) => {
				const name = `W${weekIndex + 1}-S${sectionIndex + 1}-${index +
					1}-${item.name}`;

				fetchFile(item.link.video, path.join(videoPath, `${name}.mp4`));
				fetchFile(
					item.link.subtitle,
					path.join(subtitlePath, `${name}.txt`)
				);
			});
		});
	});
}

download("algorithms-part1.json", "algorithms-part1");
