import {
	MarkdownView,
	Plugin,
	Menu,
	TAbstractFile,
	TFile,
	PluginSettingTab,
	App,
	Setting,
} from "obsidian";
import { marked, MarkedOptions } from "marked";

interface MdToHtmlSettings {
	mode: "pedantic" | "gfm" | "default";
}

const DEFAULT_SETTINGS: MdToHtmlSettings = {
	mode: "default",
};

export default class MdToHtmlPlugin extends Plugin {
	settings: MdToHtmlSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new MdToHtmlSettingTab(this.app, this));

		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu, editor, view) => {
				this.registerMenuItem(menu, async () => {
					return editor.getValue();
				}, view instanceof MarkdownView);
			})
		);

		this.registerEvent(
			this.app.workspace.on(
				"file-menu",
				async (menu, file: TAbstractFile) => {
					this.registerMenuItem(menu, async () => {
						return await this.app.vault.cachedRead(file as TFile);
					}, file instanceof TFile);
				}
			)
		);
	}

	onunload() {}

	registerMenuItem(menu: Menu, getMarkdown: () => Promise<string>, enable: boolean) {
		menu.addItem((item) => {
			item.setTitle("Copy as HTML")
				.setIcon("code-xml")
				.setDisabled(!enable)
				.onClick(async () => {
					const markdown = await getMarkdown();
					const html = await marked.parse(markdown, this.markedOptions);
					navigator.clipboard.writeText(html);
				});
		});
	}

	get markedOptions(): MarkedOptions {
		return {
			pedantic: this.settings.mode === "pedantic",
			gfm: this.settings.mode === "gfm",
		};
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

export class MdToHtmlSettingTab extends PluginSettingTab {
	plugin: MdToHtmlPlugin;
  
	constructor(app: App, plugin: MdToHtmlPlugin) {
	  super(app, plugin);
	  this.plugin = plugin;
	}
  
	display(): void {
	  let { containerEl } = this;
  
	  containerEl.empty();
  
	  new Setting(containerEl)
		.setName('Markdown flavour')
		.addDropdown((dropdown) =>
			dropdown
				.addOption('pedantic', 'Pedantic conformance to markdown.pl')
				.addOption('gfm', 'Github Flavored Markdown')
				.addOption('default', 'Default')
				.setValue(this.plugin.settings.mode)
				.onChange(async (value) => {
					this.plugin.settings.mode = value as "pedantic" | "gfm" | "default";
					await this.plugin.saveSettings();
				})
		);
	}
  }