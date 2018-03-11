import * as puppeteer from "puppeteer";
import * as creds from "../config/creds";
import { wait } from "./utils";

const EVERNOTE_LOGIN_EMAIL = "#username";
const EVERNOTE_LOGIN_PASSWORD = "#password";
const EVERNOTE_LOGIN_BUTTON = "#loginButton";

const EVERNOTE_SHOW_NOTEBOOK_BUTTON =
	"#gwt-debug-Sidebar-notebooksButton-container";
const EVERNOTE_ADD_NOTEBOOK_BUTTON =
	"#gwt-debug-NotebooksDrawer-createNotebookButton";

const nodes = {
	NOTEBOOK_NAME_INPUT:
		"#gwt-debug-CreateNotebookDialog-centeredTextBox-textBox",
	NOTEBOOK_CREATE_ACTION: "#gwt-debug-CreateNotebookDialog-confirm",
    NOTEBOOK_ITEM: "#gwt-debug-notebooksDrawerSlidingPanel .qa-notebookWidget",
    CONFIRM_DELETE_NOTEBOOK: "#gwt-debug-ConfirmationDialog-confirm"
};

(async function() {
	const browser = await puppeteer.launch({
		headless: false
	});

	const page = await browser.newPage();

	await page.goto("https://app.yinxiang.com/Login.action", {
		waitUntil: "networkidle2"
	});

	await page.click(EVERNOTE_LOGIN_EMAIL);
	await page.keyboard.type(creds.evernote.mail);

	await page.click(EVERNOTE_LOGIN_BUTTON);
	await page.waitForFunction(wait);
	await page.click(EVERNOTE_LOGIN_PASSWORD);
	await page.waitForFunction(wait);
	await page.keyboard.type(creds.evernote.password);
	await page.click(EVERNOTE_LOGIN_BUTTON);
	await page.waitForNavigation({
		waitUntil: "networkidle0"
	});

	await page.click(EVERNOTE_SHOW_NOTEBOOK_BUTTON);
	await page.waitForFunction(wait);

	const notebookList = await page.$$(nodes.NOTEBOOK_ITEM);
	let found = false;
	const notebookName = "tttt-alg";
	for (let i = 0; i < notebookList.length; i++) {
		if (found) break;

		const notebookItem = notebookList[i];
		const nameItem = await notebookItem.$(".qa-name");
		if (nameItem) {
			const name = await (await nameItem.getProperty(
				"innerText"
			)).jsonValue();

			if (name === notebookName) {
				notebookItem.hover();
				await page.waitForFunction(wait);
                const deleteItem = await notebookItem.$(".qa-deleteButton");
                await deleteItem.click();
                await page.waitForFunction(wait);
                await page.click(nodes.CONFIRM_DELETE_NOTEBOOK);
			}
		}
	}

    await page.waitForFunction(wait);
	await page.click(EVERNOTE_ADD_NOTEBOOK_BUTTON);
	await page.waitForSelector(nodes.NOTEBOOK_NAME_INPUT, {
		visible: true
	});

	await page.click(nodes.NOTEBOOK_NAME_INPUT);

	await page.keyboard.type(notebookName);
	await page.click(nodes.NOTEBOOK_CREATE_ACTION);
})();
