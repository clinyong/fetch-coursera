import * as puppeteer from "puppeteer";
import creds from "../config/creds";
import * as fse from "fs-extra";
import * as path from "path";

const COUSERA_HOST = "https://www.coursera.org";
const USER_SELECTOR = "#emailInput-input";
const PASSWORD_SELECTOR = "#passwordInput-input";
const BUTTON_SELECTOR =
	"#authentication-box-content > div > div.Box_120drhm-o_O-displayflex_poyjc-o_O-columnDirection_ia4371.pos-relative.p-a-2.bg-gray > div.Box_120drhm-o_O-displayflex_poyjc-o_O-columnDirection_ia4371.AuthenticationModalContentV1 > div > div.Box_120drhm-o_O-displayflex_poyjc-o_O-columnDirection_ia4371.rc-LoginForm > form > div.Box_120drhm-o_O-displayflex_poyjc-o_O-columnDirection_ia4371.w-100 > button";
const DATA_PATH = path.resolve(__dirname, "../data");

fse.ensureDir(DATA_PATH);

async function writeFile(name: string, content: string) {
	await fse.writeFile(path.join(DATA_PATH, name), content, "utf8");
}

(async () => {
	const browser = await puppeteer.launch({
		headless: true,
		args: [
			"--proxy-server=127.0.0.1:8124" // Or whatever the address is
		]
	});

	async function login(browser: puppeteer.Browser) {
		const page = await browser.newPage();
		await page.goto("https://www.coursera.org/?authMode=login", {
			waitUntil: "networkidle2",
			timeout: 0
		});

		await page.click(USER_SELECTOR);
		await page.keyboard.type(creds.mail);
		await page.click(PASSWORD_SELECTOR);
		await page.keyboard.type(creds.password);

		await page.click(BUTTON_SELECTOR);

		await page.waitForNavigation({
			timeout: 0
		});
		await page.close();
	}

	async function getWeeks(browser: puppeteer.Browser) {
		const page = await browser.newPage();
		await page.goto(
			"https://www.coursera.org/learn/algorithms-part1/home/welcome",
			{
				waitUntil: "networkidle2",
				timeout: 0
			}
		);

		const len = (await page.$$(".week-section>.rc-WeekAssignmentIcons"))
			.length;
		await page.close();

		return len;
	}

	async function getCourseDetail(course) {
		const videoIcon = await course.$(".cif-play");

		if (videoIcon) {
			const titleItem = await course.$(
				".item-text-container > .item-name >span"
			);

			const name = await (await titleItem.getProperty(
				"innerText"
			)).jsonValue();

			const linkItem = await course.$("a");
			const detailLink = await (await linkItem.getProperty(
				"href"
			)).jsonValue();

			const detailPage = await browser.newPage();

			await detailPage.goto(detailLink, {
				waitUntil: "domcontentloaded",
				timeout: 0
			});

			await detailPage.waitForFunction(
				"document.querySelector('.rc-LectureDownloadItem') !== null",
				{
					timeout: 3000000
				}
			);

			const videoItem = await detailPage.$(
				".rc-LectureDownloadItem.resource-list-item > a"
			);
			const subtitleItem = await detailPage.$(
				".rc-SubtitleDownloadItem.resource-list-item > a"
			);

			const videoLink = await (await videoItem.getProperty(
				"href"
			)).jsonValue();
			const subtitleLink = await (await subtitleItem.getProperty(
				"href"
			)).jsonValue();

			await detailPage.close();

			if (videoItem && subtitleItem) {
				return {
					name,
					link: {
						video: videoLink,
						subtitle: subtitleLink
					}
				};
			} else {
				return {
					name,
					link: null
				};
			}
		} else {
			return null;
		}
	}

	await login(browser);
	const weekLen = await getWeeks(browser);

	const list = [];
	for (let i = 1; i < weekLen + 1; i++) {
		const weekPage = await browser.newPage();
		await weekPage.goto(
			`https://www.coursera.org/learn/algorithms-part1/home/week/${i}`,
			{
				waitUntil: "networkidle2",
				timeout: 0
			}
		);
		const sectionList = await weekPage.$$(".rc-NamedItemList");
		const resultList = await Promise.all(
			sectionList.map(async section => {
				const courseList = await section.$$(".rc-ItemHonorsWrapper");
				const resultList = await Promise.all(
					courseList.map(getCourseDetail)
				);

				return resultList.filter(item => item !== null);
			})
		);
		await weekPage.close();
		console.log(`Finish week${i}.`);

		list.push(resultList);
	}

	await browser.close();
	await writeFile("algorithms-part1.json", JSON.stringify(list));
})();
