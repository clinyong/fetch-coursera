import * as puppeteer from "puppeteer";
import * as fse from "fs-extra";
import * as path from "path";
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
	CONFIRM_DELETE_NOTEBOOK: "#gwt-debug-ConfirmationDialog-confirm",
	SHOW_CREATE_NOTE: "#gwt-debug-Sidebar-newNoteButton-container",
	NOTE_CONTENT: "#gwt-debug-NoteContentEditorView-root",
	CREATE_NOTE: "#gwt-debug-NoteAttributes-doneButton"
};

async function createNote(courseName: string) {
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
	const notebookName = courseName;
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
	const showAddBTN = await page.$(EVERNOTE_ADD_NOTEBOOK_BUTTON);

	await page.waitForFunction(wait);
	await page.waitForFunction(wait);
	await page.waitForFunction(wait);
	await page.waitForFunction(wait);
	await page.waitForFunction(wait);
	await page.waitForFunction(wait);

	await page.click(EVERNOTE_ADD_NOTEBOOK_BUTTON);
	await page.waitForFunction(wait);
	await page.click(nodes.NOTEBOOK_NAME_INPUT);
	await page.waitForFunction(wait);

	await page.keyboard.type(notebookName);
	await page.click(nodes.NOTEBOOK_CREATE_ACTION);

	const subtitlePath = path.resolve(
		__dirname,
		`../data/${courseName}/subtitle`
	);
	const subtitleFiles = await fse.readdir(subtitlePath);
	for (let i = 0; i < 1; i++) {
		const filename = subtitleFiles[i];
		const contentLines = (await fse.readFile(
			path.join(subtitlePath, filename),
			"utf8"
		)).split("\n");
		await page.waitForFunction(wait);
		await page.click(nodes.SHOW_CREATE_NOTE);
		await page.waitForFunction(wait);
		await page.keyboard.type(filename);
		await page.waitForFunction(wait);
		await page.click(nodes.NOTE_CONTENT);
		await page.waitForFunction(wait);

		for (let j = 0; j < contentLines.length; j++) {
			await page.keyboard.type(contentLines[j]);
			await page.keyboard.press("Enter");
		}

		await page.waitForFunction(wait);
		await page.click(nodes.CREATE_NOTE);
	}
}

createNote("algorithms-part1");
