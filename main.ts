import { Plugin, PluginSettingTab, App, MarkdownPostProcessorContext, TFile, setIcon, MarkdownView, Setting, Notice } from 'obsidian';

interface AudioFolder {
	name: string;
	path: string;
	loop: boolean;
	icon?: string;
}

interface LocalSoundboardSettings {
	folders: AudioFolder[];
	showStatusBar: boolean;
	defaultVolume: number;
	autoLoop: boolean;
}

	const DEFAULT_SETTINGS: LocalSoundboardSettings = {
	folders: [],
	showStatusBar: true,
	defaultVolume: 0.5,
	autoLoop: false
}

export default class LocalSoundboardPlugin extends Plugin {
	settings!: LocalSoundboardSettings;
	statusBarItem: HTMLElement | null = null;
	statusBarAudio: HTMLAudioElement[] = [];

	async onload() {
		await this.loadSettings();

		// Register the code block processor
		this.registerMarkdownCodeBlockProcessor('local-soundboard', this.processLocalSoundboard.bind(this));

		// Add setting tab
		this.addSettingTab(new LocalSoundboardSettingTab(this.app, this));

		// Add ribbon icon
		this.addRibbonIcon('folder-sync', 'Refresh Local Soundboard', () => {
			this.refreshPlugin();
		});

		// Add command for refreshing
		this.addCommand({
			id: 'refresh-soundboard',
			name: 'Refresh Local Soundboard',
			callback: () => {
				this.refreshPlugin();
			}
		});

		// Add status bar
		this.setupStatusBar();
	}

	onunload() {
		// Clean up status bar
		if (this.statusBarItem) {
			this.statusBarItem.remove();
		}
	}

	async loadSettings() {
		const loadedSettings = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedSettings);
		
		// Handle migration from old settings structure
		if (!Array.isArray(this.settings.folders)) {
			// If folders is not an array, use default folders
			this.settings.folders = DEFAULT_SETTINGS.folders;
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.updateStatusBar();
	}

	refreshPlugin() {
		// Show notice to user
		new Notice('Refreshing Local Soundboard...');
		
		// Stop all currently playing audio
		this.stopAllAudio();
		
		// Force refresh status bar (this will reload audio file lists)
		if (this.statusBarItem) {
			this.statusBarItem.remove();
			this.statusBarItem = null;
		}
		
		// Recreate status bar if enabled
		if (this.settings.showStatusBar) {
			this.setupStatusBar();
		}
		
		// Show completion notice
		new Notice('Local Soundboard refreshed successfully!');
	}

	private stopAllAudio() {
		if (this.statusBarAudio && Array.isArray(this.statusBarAudio)) {
			this.statusBarAudio.forEach(audio => {
				audio.pause();
				audio.currentTime = 0;
			});
		}
	}

	setupStatusBar() {
		if (!this.settings.showStatusBar) {
			return;
		}

		this.statusBarItem = this.addStatusBarItem();
		this.updateStatusBar();
	}

	private updateStatusBar() {
		if (!this.statusBarItem || !this.settings.showStatusBar) {
			return;
		}

		this.statusBarItem.empty();
		this.statusBarItem.addClass('local-soundboard-status');

		const container = this.statusBarItem.createDiv({ cls: 'soundboard-status-container' });

		// Clear existing audio elements
		if (this.statusBarAudio && Array.isArray(this.statusBarAudio)) {
			this.statusBarAudio.forEach(audio => audio.pause());
		}
		this.statusBarAudio = [];

		// Create select and audio for each folder
		if (Array.isArray(this.settings.folders)) {
			this.settings.folders.forEach((folder, index) => {
				this.createFolderAudioPlayer(container, folder, index);
			});
		}

		// Add refresh button
		this.createRefreshButton(container);
	}

	private async updateAudioSelector(audioSelect: HTMLSelectElement, folderPath: string) {
		try {
			const audioFiles = await this.getAudioFilesFromFolder(folderPath);
			
			// Clear existing options
			audioSelect.innerHTML = '';
			
			// Add default option
			audioSelect.createEl('option', { 
				text: '🎶 Select Audio', 
				value: ''
			});
			
			// Add audio file options
			audioFiles.forEach(file => {
				audioSelect.createEl('option', { 
					text: file.basename, 
					value: file.path 
				});
			});
			
			// Enable audio selector
			audioSelect.removeAttribute('disabled');
			
		} catch (error) {
			console.error('Error loading audio files:', error);
			audioSelect.innerHTML = '';
			audioSelect.createEl('option', { 
				text: '❌ Error loading files', 
				value: ''
			});
		}
	}

	private createFolderAudioPlayer(container: HTMLElement, folder: AudioFolder, folderIndex: number) {
		// Create folder container
		const folderContainer = container.createDiv({ cls: 'folder-status-container' });

		// Create folder selector control with hover effect
		const selectorContainer = folderContainer.createDiv({ cls: 'status-bar-selector-control' });
		
		// Create folder icon element
		const folderIconEl = selectorContainer.createEl('div', { cls: 'status-bar-folder-icon' });
		if (folder.icon) {
			setIcon(folderIconEl, folder.icon);
		} else {
			setIcon(folderIconEl, 'folder'); // default folder icon
		}

		// Create audio file selector (initially hidden)
		const audioSelect = selectorContainer.createEl('select', { 
			cls: 'audio-selector-small audio-selector-hidden' 
		});
		audioSelect.createEl('option', { text: folder.name, value: '' });

		// Hover functionality for selector control
		selectorContainer.addEventListener('mouseenter', () => {
			audioSelect.classList.remove('audio-selector-hidden');
		});

		selectorContainer.addEventListener('mouseleave', () => {
			audioSelect.classList.add('audio-selector-hidden');
		});

		// Create audio player container
		const audioPlayerContainer = folderContainer.createDiv({ cls: 'status-bar-audio-player-small' });

		// Create HTML5 audio element (hidden)
		const audioEl = audioPlayerContainer.createEl('audio', {
			attr: { 
				preload: 'none',
				...(folder.loop ? { loop: 'true' } : {})
			},
			cls: 'status-bar-audio-element'
		});

		// Create volume control container
		const volumeControlContainer = audioPlayerContainer.createDiv({ 
			cls: 'status-bar-volume-control' 
		});

		// Create sound icon
		const soundIcon = volumeControlContainer.createEl('div', {
			cls: 'status-bar-sound-icon'
		});
		setIcon(soundIcon, 'volume-2');

		// Create volume slider (initially hidden)
		const volumeSlider = volumeControlContainer.createEl('input', {
			cls: 'status-bar-volume-slider-small status-bar-volume-slider-hidden',
			attr: {
				type: 'range',
				min: '0',
				max: '1',
				step: '0.1',
				value: this.settings.defaultVolume.toString(),
				orient: 'vertical'
			}
		});

		// Create play/pause button
		const playButton = audioPlayerContainer.createEl('button', {
			cls: 'status-bar-play-button-small play-state',
			attr: { type: 'button' }
		});
		
		// Use CSS content for the icon
		playButton.textContent = '';

		// Set initial volume
		audioEl.volume = this.settings.defaultVolume;

		// Audio controls functionality
		let isPlaying = false;

		playButton.addEventListener('click', () => {
			if (isPlaying) {
				audioEl.pause();
				audioEl.currentTime = 0; // Stop audio completely
				playButton.removeClass('pause-state');
				playButton.addClass('play-state');
				isPlaying = false;
				// Reset select to default value
				audioSelect.value = '';
			} else {
				audioEl.play();
				playButton.removeClass('play-state');
				playButton.addClass('pause-state');
				isPlaying = true;
			}
		});

		// Volume slider functionality
		volumeSlider.addEventListener('input', () => {
			const volume = parseFloat(volumeSlider.value);
			audioEl.volume = volume;
		});

		// Hover functionality for volume control
		volumeControlContainer.addEventListener('mouseenter', () => {
			volumeSlider.classList.remove('status-bar-volume-slider-hidden');
		});

		volumeControlContainer.addEventListener('mouseleave', () => {
			volumeSlider.classList.add('status-bar-volume-slider-hidden');
		});

		// Reset button and select when audio ends
		audioEl.addEventListener('ended', () => {
			if (!folder.loop) {
				playButton.removeClass('pause-state');
				playButton.addClass('play-state');
				isPlaying = false;
				// Reset select to default value
				audioSelect.value = '';
			}
		});

		// Load audio files for this folder
		this.loadAudioFilesForFolder(audioSelect, audioEl, folder.path);

		// Handle audio file selection
		audioSelect.addEventListener('change', (e: Event) => {
			const target = e.target as HTMLSelectElement;
			if (target.value) {
				// Update audio source and play automatically
				audioEl.src = this.app.vault.adapter.getResourcePath(target.value);
				audioEl.load();
				audioEl.play().catch(error => {
					console.error('Error playing audio:', error);
				});
				
				// Update play button to playing state
				playButton.removeClass('play-state');
				playButton.addClass('pause-state');
				isPlaying = true;
			}
		});

		// Store audio element reference
		this.statusBarAudio.push(audioEl);
	}

	private createRefreshButton(container: HTMLElement) {
		// Create refresh button container
		const refreshContainer = container.createDiv({ cls: 'status-bar-refresh-container' });
		
		// Create refresh button
		const refreshButton = refreshContainer.createEl('button', {
			cls: 'status-bar-refresh-button',
			attr: { 
				type: 'button',
				'aria-label': 'Refresh Local Soundboard'
			}
		});
		
		// Create icon container inside the button
		const refreshIconContainer = refreshButton.createDiv({ cls: 'refresh-icon-container' });
		setIcon(refreshIconContainer, 'folder-sync');
		
		// Add click event listener
		refreshButton.addEventListener('click', () => {
			this.refreshPlugin();
		});
	}

	private async loadAudioFilesForFolder(audioSelect: HTMLSelectElement, audioEl: HTMLAudioElement, folderPath: string) {
		try {
			const audioFiles = await this.getAudioFilesFromFolder(folderPath);
			
			// Add audio file options
			audioFiles.forEach(file => {
				audioSelect.createEl('option', { 
					text: file.basename, 
					value: file.path 
				});
			});
			
		} catch (error) {
			console.error('Error loading audio files:', error);
			audioSelect.createEl('option', { 
				text: '❌ Error', 
				value: ''
			});
		}
	}

	private removeAudioPlayer(container: HTMLElement) {
		const existingPlayers = container.querySelectorAll('.status-bar-audio-player-small');
		existingPlayers.forEach(player => player.remove());
		
		// Pause and clear all audio elements
		if (this.statusBarAudio && Array.isArray(this.statusBarAudio)) {
			this.statusBarAudio.forEach(audio => audio.pause());
		}
		this.statusBarAudio = [];
	}

	private insertSoundboardBlock(folderPath: string, audioFilePath?: string) {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (activeView) {
			const editor = activeView.editor;
			const cursor = editor.getCursor();
			
			let block = `\`\`\`local-soundboard\nfolder: ${folderPath}`;
			
			// If specific audio file selected, add it as title
			if (audioFilePath) {
				const fileName = audioFilePath.split('/').pop()?.replace(/\.[^/.]+$/, '') || '';
				block += `\ntitle: ${fileName}`;
			}
			
			block += '\n\`\`\`\n';
			
			editor.replaceRange(block, cursor);
			editor.setCursor(cursor.line + block.split('\n').length, 0);
		}
	}



	private async processLocalSoundboard(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
		const container = el.createDiv({ cls: 'local-soundboard-container' });
		
		// Parse the code block content to get attributes
		const attributes = this.parseCodeBlockAttributes(source.trim());
		
		// Get folder path from folder attribute
		const folderPath = attributes.folder;
		if (!folderPath) {
			container.createEl('p', { text: 'Please specify a "folder" attribute with the folder path.' });
			container.createEl('pre', { text: 'Example:\nfolder: Audio/SFX\ntitle: Sound Effects\nloop: true' });
			return;
		}

		// Parse loop attribute (default to false)
		const shouldLoop = attributes.loop === 'true';

		// Determine the title to display
		let title: string;
		if (attributes.title) {
			title = attributes.title;
		} else {
			title = `Soundboard: ${folderPath}`;
		}

		// Create header with optional icon
		const headerEl = container.createEl('h4', { cls: 'soundboard-header' });
		
		// Add icon if specified
		if (attributes.icon) {
			const iconEl = headerEl.createSpan({ cls: 'soundboard-icon' });
			setIcon(iconEl, attributes.icon);
			headerEl.createSpan({ text: ` ${title}` }); // Space after icon
		} else {
			headerEl.setText(title);
		}

		try {
			const audioFiles = await this.getAudioFilesFromFolder(folderPath);
			
			if (audioFiles.length === 0) {
				container.createEl('p', { text: 'No audio files found in the specified folder.' });
				return;
			}

			// Create single audio player exactly like status bar
			const audioContainer = container.createDiv({ cls: 'status-bar-audio-player-small' });
			
			// Create selector control with icon exactly like status bar
			const selectorContainer = audioContainer.createDiv({ cls: 'status-bar-selector-control' });
			
			// Create folder icon element exactly like status bar
			const folderIconEl = selectorContainer.createEl('div', { cls: 'status-bar-folder-icon' });
			if (attributes.icon) {
				setIcon(folderIconEl, attributes.icon);
			} else {
				setIcon(folderIconEl, 'folder'); // default folder icon
			}

			// Create audio file selector (initially hidden, just like status bar)
			const audioSelect = selectorContainer.createEl('select', { 
				cls: 'audio-selector-small audio-selector-hidden' 
			});
			audioSelect.createEl('option', { text: title, value: '' });

			// Hover functionality for selector control (exactly like status bar)
			selectorContainer.addEventListener('mouseenter', () => {
				audioSelect.classList.remove('audio-selector-hidden');
			});

			selectorContainer.addEventListener('mouseleave', () => {
				audioSelect.classList.add('audio-selector-hidden');
			});
			
			// Add audio file options
			audioFiles.forEach(file => {
				audioSelect.createEl('option', { 
					text: file.basename, 
					value: file.path 
				});
			});
			
			// Create HTML5 audio element (hidden)
			const audioEl = audioContainer.createEl('audio', {
				attr: { 
					preload: 'none',
					...(shouldLoop ? { loop: 'true' } : {})
				},
				cls: 'status-bar-audio-element'
			});
			
			// Create volume control container exactly like status bar
			const volumeControlContainer = audioContainer.createDiv({ 
				cls: 'status-bar-volume-control' 
			});

			// Create sound icon exactly like status bar
			const soundIcon = volumeControlContainer.createEl('div', {
				cls: 'status-bar-sound-icon'
			});
			setIcon(soundIcon, 'volume-2');

			// Create volume slider (initially hidden, exactly like status bar)
			const volumeSlider = volumeControlContainer.createEl('input', {
				cls: 'status-bar-volume-slider-small status-bar-volume-slider-hidden',
				attr: {
					type: 'range',
					min: '0',
					max: '1',
					step: '0.1',
					value: '1',
					orient: 'vertical'
				}
			});
			
			// Create play/pause button exactly like status bar
			const playButton = audioContainer.createEl('button', {
				cls: 'status-bar-play-button-small play-state',
				attr: { type: 'button' }
			});
			
			// Use CSS content for the icon
			playButton.textContent = '';
			
			// Set initial volume
			audioEl.volume = 1;
			
			// Audio controls functionality
			let isPlaying = false;
			
			playButton.addEventListener('click', () => {
				if (isPlaying) {
					audioEl.pause();
					audioEl.currentTime = 0; // Stop audio completely
					playButton.removeClass('pause-state');
					playButton.addClass('play-state');
					isPlaying = false;
					// Reset select to default value
					audioSelect.value = '';
				} else {
					audioEl.play();
					playButton.removeClass('play-state');
					playButton.addClass('pause-state');
					isPlaying = true;
				}
			});
			
			// Volume slider functionality
			volumeSlider.addEventListener('input', () => {
				const volume = parseFloat(volumeSlider.value);
				audioEl.volume = volume;
			});
			
			// Hover functionality for volume control (exactly like status bar)
			volumeControlContainer.addEventListener('mouseenter', () => {
				volumeSlider.classList.remove('status-bar-volume-slider-hidden');
			});

			volumeControlContainer.addEventListener('mouseleave', () => {
				volumeSlider.classList.add('status-bar-volume-slider-hidden');
			});
			
			// Reset button and select when audio ends
			audioEl.addEventListener('ended', () => {
				if (!shouldLoop) {
					playButton.removeClass('pause-state');
					playButton.addClass('play-state');
					isPlaying = false;
					// Reset select to default value
					audioSelect.value = '';
				}
			});
			
			// Handle audio file selection
			audioSelect.addEventListener('change', (e: Event) => {
				const target = e.target as HTMLSelectElement;
				if (target.value) {
					// Update audio source and play automatically
					audioEl.src = this.app.vault.adapter.getResourcePath(target.value);
					audioEl.load();
					audioEl.play().catch(error => {
						console.error('Error playing audio:', error);
					});
					
					// Update play button to playing state
					playButton.removeClass('play-state');
					playButton.addClass('pause-state');
					isPlaying = true;
				}
			});
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			container.createEl('p', { 
				text: `Error loading audio files: ${errorMessage}`,
				cls: 'error-message'
			});
		}
	}

	private async getAudioFilesFromFolder(folderPath: string): Promise<TFile[]> {
		const audioExtensions = ['mp3', 'wav', 'ogg', 'webm', 'm4a', 'flac', 'aac'];
		const files: TFile[] = [];
		
		try {
			const folder = this.app.vault.getAbstractFileByPath(folderPath);
			if (!folder || folder instanceof TFile) {
				throw new Error(`Folder "${folderPath}" not found`);
			}
			
			// Get all files recursively from the folder
			const allFiles = this.app.vault.getAllLoadedFiles();
			for (const file of allFiles) {
			if (file instanceof TFile && 
				file.path.startsWith(folderPath) && 
				audioExtensions.indexOf(file.extension.toLowerCase()) !== -1) {
				files.push(file);
			}
			}
		} catch (error) {
			console.error('Error accessing folder:', error);
			throw error;
		}

		return files.sort((a, b) => a.name.localeCompare(b.name));
	}

	private getAudioMimeType(extension: string): string {
		const mimeTypes: Record<string, string> = {
			'mp3': 'audio/mpeg',
			'wav': 'audio/wav',
			'ogg': 'audio/ogg',
			'webm': 'audio/webm',
			'm4a': 'audio/mp4',
			'flac': 'audio/flac',
			'aac': 'audio/aac'
		};
		
		return mimeTypes[extension.toLowerCase()] || 'audio/*';
	}

	private parseCodeBlockAttributes(content: string): Record<string, string> {
		const attributes: Record<string, string> = {};
		
		if (!content.trim()) {
			return attributes;
		}
		
		// Split by lines and parse each attribute
		const lines = content.split('\n').map(line => line.trim()).filter(line => line);
		
		for (const line of lines) {
			// Match pattern: key: value
			const match = line.match(/^(\w+):\s*(.+)$/);
			if (match && match[1] && match[2]) {
				const key = match[1];
				const value = match[2];
				attributes[key] = value.trim();
			}
		}
		
		return attributes;
	}
}

class LocalSoundboardSettingTab extends PluginSettingTab {
	plugin: LocalSoundboardPlugin;

	constructor(app: App, plugin: LocalSoundboardPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'Local Soundboard Settings' });

		// Status bar settings
		containerEl.createEl('h3', { text: 'Status Bar' });
		
		new Setting(containerEl)
			.setName('Show Status Bar')
			.setDesc('Display folder selector in status bar for quick access')
			.addToggle((toggle: any) => toggle
				.setValue(this.plugin.settings.showStatusBar)
				.onChange(async (value: boolean) => {
					this.plugin.settings.showStatusBar = value;
					await this.plugin.saveSettings();
					
					// Toggle status bar visibility
					if (value) {
						this.plugin.setupStatusBar();
					} else if (this.plugin.statusBarItem) {
						this.plugin.statusBarItem.remove();
						this.plugin.statusBarItem = null;
					}
				}));

		// Folder management
		containerEl.createEl('h3', { text: 'Folder Management' });
		
		const folderContainer = containerEl.createDiv({ cls: 'folder-management-container' });
		
		// Display existing folders
		this.displayFolders(folderContainer);

	// Create buttons container
		const buttonsContainer = containerEl.createDiv({ cls: 'folder-buttons-container' });
		
		// Add new folder button
		const addFolderBtn = buttonsContainer.createEl('button', {
			cls: 'mod-cta'
		});
		setIcon(addFolderBtn, 'plus');
		
		// Global save button
		const globalSaveBtn = buttonsContainer.createEl('button', {
			cls: 'mod-cta'
		});
		setIcon(globalSaveBtn, 'save');
		
		addFolderBtn.addEventListener('click', () => {
			this.addNewFolder(folderContainer);
		});

		globalSaveBtn.addEventListener('click', async () => {
			await this.saveAllFolderChanges(folderContainer);
		});

		// Default settings
		containerEl.createEl('h3', { text: 'Default Settings' });
		
		new Setting(containerEl)
			.setName('Default Volume')
			.setDesc('Default volume for new audio controls (0.1 - 1.0)')
			.addSlider((slider: any) => slider
				.setLimits(0.1, 1.0, 0.1)
				.setValue(this.plugin.settings.defaultVolume)
				.setDynamicTooltip()
				.onChange(async (value: number) => {
					this.plugin.settings.defaultVolume = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Auto Loop')
			.setDesc('Enable audio looping by default')
			.addToggle((toggle: any) => toggle
				.setValue(this.plugin.settings.autoLoop)
				.onChange(async (value: boolean) => {
					this.plugin.settings.autoLoop = value;
					await this.plugin.saveSettings();
				}));

		// Usage instructions
		containerEl.createEl('h3', { text: 'Usage' });
		
		containerEl.createEl('p', {
			text: 'Create soundboards in your notes by specifying the folder path directly:'
		});
		containerEl.createEl('pre', {
			text: '```local-soundboard\nfolder: Audio/SFX\nicon: zap\ntitle: Battle Sound Effects\nloop: true\n```'
		});
		
		containerEl.createEl('h4', { text: 'Attributes' });
		const attributesList = containerEl.createEl('ul');
		attributesList.createEl('li').innerHTML = '<strong>folder</strong>: (required) Direct path to the audio folder relative to your vault root (e.g., "Audio/SFX")';
		attributesList.createEl('li').innerHTML = '<strong>icon</strong>: (optional) Lucide icon name to display before the title (e.g., "zap", "music", "volume-2")';
		attributesList.createEl('li').innerHTML = '<strong>title</strong>: (optional) Custom title for the soundboard (e.g., "Battle Sound Effects")';
		attributesList.createEl('li').innerHTML = '<strong>loop</strong>: (optional) Set to "true" to enable audio looping, "false" or omit to disable';
		
		containerEl.createEl('h4', { text: 'Popular Folder Icons' });
		const iconsInfo = containerEl.createEl('p', {
			text: 'Common Lucide icons for audio folders: '
		});
		iconsInfo.innerHTML += '<code>music</code>, <code>volume-2</code>, <code>radio</code>, <code>headphones</code>, <code>speaker</code>, <code>mic</code>, <code>trees</code> (ambient), <code>zap</code> (effects), <code>guitar</code>, <code>piano</code>, <code>drum</code>';
		
		containerEl.createEl('p').innerHTML = 'Find more icons at <a href="https://lucide.dev/icons/" target="_blank">lucide.dev/icons</a>';
		
		containerEl.createEl('h4', { text: 'Supported Audio Formats' });
		const formatsList = containerEl.createEl('ul');
		formatsList.createEl('li').textContent = 'MP3 (.mp3)';
		formatsList.createEl('li').textContent = 'WAV (.wav)';
		formatsList.createEl('li').textContent = 'OGG (.ogg)';
		formatsList.createEl('li').textContent = 'WebM (.webm)';
		formatsList.createEl('li').textContent = 'M4A (.m4a)';
		formatsList.createEl('li').textContent = 'FLAC (.flac)';
		formatsList.createEl('li').textContent = 'AAC (.aac)';
	}

	private displayFolders(container: HTMLElement) {
		container.empty();
		
		if (!Array.isArray(this.plugin.settings.folders) || this.plugin.settings.folders.length === 0) {
			container.createEl('p', { 
				text: 'No folders configured. Add folders to use the status bar selector.',
				cls: 'setting-item-description'
			});
			return;
		}

		this.plugin.settings.folders.forEach((folder, index) => {
			const folderItem = container.createDiv({ cls: 'folder-item' });
			
			const folderInfo = folderItem.createDiv({ cls: 'folder-info' });
			
			// Name input
			const nameInput = folderInfo.createEl('input', {
				type: 'text',
				value: folder.name,
				placeholder: 'Folder name',
				cls: 'folder-name-input'
			});
			
			// Path input
			const pathInput = folderInfo.createEl('input', {
				type: 'text',
				value: folder.path,
				placeholder: 'Folder path',
				cls: 'folder-path-input'
			});
			
			// Icon input with preview
			const iconContainer = folderInfo.createDiv({ cls: 'folder-icon-container' });
			
			const iconPreview = iconContainer.createEl('div', { cls: 'folder-icon-preview' });
			if (folder.icon) {
				setIcon(iconPreview, folder.icon);
			}
			
			const iconInput = iconContainer.createEl('input', {
				type: 'text',
				value: folder.icon || '',
				placeholder: 'Lucide icon name (e.g., music, volume-2)',
				cls: 'folder-icon-input'
			});
			
			// Update icon preview when input changes
			iconInput.addEventListener('input', () => {
				const iconName = iconInput.value.trim();
				iconPreview.empty();
				if (iconName) {
					try {
						setIcon(iconPreview, iconName);
					} catch (error) {
						iconPreview.textContent = '❌';
					}
				}
			});
			
			// Add loop checkbox
			const loopContainer = folderInfo.createDiv({ cls: 'folder-loop-container' });
			const loopCheckbox = loopContainer.createEl('input', {
				attr: {
					type: 'checkbox'
				},
				cls: 'folder-loop-checkbox'
			});
			
			// Set checked property separately
			loopCheckbox.checked = folder.loop;
			const loopLabel = loopContainer.createEl('label', {
				text: 'Loop audio',
				cls: 'folder-loop-label'
			});
			loopLabel.setAttribute('for', `loop-${index}`);
			
			const actions = folderItem.createDiv({ cls: 'folder-actions' });
			
			const deleteBtn = actions.createEl('button', {
				cls: 'mod-warning'
			});
			setIcon(deleteBtn, 'trash-2');
			
			deleteBtn.addEventListener('click', async () => {
				this.plugin.settings.folders.splice(index, 1);
				await this.plugin.saveSettings();
				this.displayFolders(container);
			});
		});
	}

	private addNewFolder(container: HTMLElement) {
		const newFolderItem = container.createDiv({ cls: 'folder-item new-folder' });
		
		const folderInfo = newFolderItem.createDiv({ cls: 'folder-info' });
		
		// Name input
		const nameInput = folderInfo.createEl('input', {
			type: 'text',
			placeholder: 'Folder name',
			cls: 'folder-name-input'
		});
		
		// Path input
		const pathInput = folderInfo.createEl('input', {
			type: 'text',
			placeholder: 'Folder path',
			cls: 'folder-path-input'
		});
		
		// Icon input with preview
		const iconContainer = folderInfo.createDiv({ cls: 'folder-icon-container' });
		
		const iconPreview = iconContainer.createEl('div', { cls: 'folder-icon-preview' });
		
		const iconInput = iconContainer.createEl('input', {
			type: 'text',
			placeholder: 'Lucide icon name (e.g., music, volume-2)',
			cls: 'folder-icon-input'
		});
		
		// Update icon preview when input changes
		iconInput.addEventListener('input', () => {
			const iconName = iconInput.value.trim();
			iconPreview.empty();
			if (iconName) {
				try {
					setIcon(iconPreview, iconName);
				} catch (error) {
					iconPreview.textContent = '❌';
				}
			}
		});
		
		const actions = newFolderItem.createDiv({ cls: 'folder-actions' });
		
		const addBtn = actions.createEl('button', {
			text: 'Add',
			cls: 'mod-cta'
		});
		
		const cancelBtn = actions.createEl('button', {
			text: 'Cancel'
		});
		
		addBtn.addEventListener('click', async () => {
			const name = nameInput.value.trim();
			const path = pathInput.value.trim();
			const icon = iconInput.value.trim();
			
			if (name && path) {
				this.plugin.settings.folders.push({ 
					name, 
					path, 
					loop: false,
					icon: icon || undefined
				});
				await this.plugin.saveSettings();
				this.displayFolders(container);
			}
		});
		
		cancelBtn.addEventListener('click', () => {
			this.displayFolders(container);
		});
		
		nameInput.focus();
	}

	private async saveAllFolderChanges(container: HTMLElement) {
		const folderItems = container.querySelectorAll('.folder-item');
		const updatedFolders: AudioFolder[] = [];

		folderItems.forEach((folderItem, index) => {
			const nameInput = folderItem.querySelector('.folder-name-input') as HTMLInputElement;
			const pathInput = folderItem.querySelector('.folder-path-input') as HTMLInputElement;
			const iconInput = folderItem.querySelector('.folder-icon-input') as HTMLInputElement;
			const loopCheckbox = folderItem.querySelector('.folder-loop-checkbox') as HTMLInputElement;

			if (nameInput && pathInput && loopCheckbox) {
				const existingFolder = this.plugin.settings.folders[index];
				if (existingFolder) {
					const iconValue = iconInput?.value.trim();
					updatedFolders.push({
						name: nameInput.value.trim() || existingFolder.name,
						path: pathInput.value.trim() || existingFolder.path,
						loop: loopCheckbox.checked,
						icon: iconValue || undefined
					});
				}
			}
		});

		this.plugin.settings.folders = updatedFolders;
		await this.plugin.saveSettings();
		
		// Show confirmation
		const notice = new Notice('All folder configurations saved successfully!');
	}
}