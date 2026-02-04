# Local Soundboard Plugin for Obsidian

A plugin that creates interactive soundboards from local audio files in specified folders of your Obsidian workspace.

## Features

- 🎵 **Interactive Audio Playback** - Play audio files directly from your notes with custom controls
- 📁 **Direct Folder Integration** - Specify folder paths directly in code blocks, no configuration required
- 🎛️ **Advanced Audio Controls** - Volume sliders, play/pause buttons, and looping support
- 🏷️ **Customizable Interface** - Custom titles, Lucide icons, and visual organization
- 🔊 **Status Bar Integration** - Quick access audio controls in Obsidian's status bar
- ⚙️ **Settings Management** - Configure folders, default volume, and behavior through settings tab
- 🎨 **Responsive Design** - Clean interface that works on desktop and mobile
- 🔄 **Real-time Updates** - Refresh functionality to update audio file lists
- 🎯 **Hover Effects** - Intuitive UI with expanding selectors and volume controls

## Installation

### From Obsidian Community Plugins (Recommended)
1. Open Obsidian Settings
2. Go to Community Plugins
3. Browse and search for "Local Soundboard"
4. Install and enable the plugin

### Manual Installation
1. Download the latest release from GitHub
2. Extract the files to your Obsidian plugins folder:
   - Windows: `%APPDATA%\Obsidian\plugins\local-soundboard\`
   - macOS: `~/Library/Application Support/obsidian/plugins/local-soundboard/`
   - Linux: `~/.config/obsidian/plugins/local-soundboard/`
3. Restart Obsidian
4. Enable the plugin in Settings > Community Plugins

## Usage

### Quick Start

The Local Soundboard plugin offers two main ways to use audio in your Obsidian workspace:

1. **Direct Code Blocks** - Create soundboards directly in notes
2. **Status Bar Integration** - Quick access controls from the status bar

### 1. Creating Soundboards in Notes

Add a code block with the `local-soundboard` language to create an interactive audio player:

\`\`\`local-soundboard
folder: Audio/SFX
icon: zap
title: Battle Sound Effects
loop: true
\`\`\`

#### How It Works

When you add this code block, the plugin creates:

- **Header Section**: Displays your custom title with optional Lucide icon
- **Audio Selector**: A dropdown (shown on hover) containing all audio files from the specified folder
- **Play Controls**: Circular play/pause button that controls audio playback
- **Volume Control**: Volume icon that reveals a slider on hover for audio adjustment
- **Automatic Loading**: Audio files load and play automatically when selected

#### Supported Attributes

- **folder**: *(required)* Path to audio folder relative to your vault root
  - Examples: `"Audio/SFX"`, `"Music/Background"`, `"Podcasts/Episodes"`
- **icon**: *(optional)* Lucide icon name for visual identification
  - Examples: `"zap"`, `"music"`, `"volume-2"`, `"headphones"`
- **title**: *(optional)* Custom display name for the soundboard
  - Default: `"Soundboard: [folder path]"`
- **loop**: *(optional)* Enable audio looping
  - Values: `"true"` or `"false"` (default: false)

### 2. Status Bar Integration

Configure folders in the plugin settings to add quick-access audio controls to Obsidian's status bar:

#### Setting Up Status Bar Folders

1. Go to **Settings → Community Plugins → Local Soundboard**
2. Enable **"Show Status Bar"** option
3. Add folders with custom names, paths, and icons
4. Configure default volume and looping preferences

#### Status Bar Features

- **Folder Icons**: Click folder icons to reveal audio file selectors
- **Quick Playback**: Select files to play immediately without opening notes
- **Volume Control**: Hover over volume icons for precise volume adjustment
- **Refresh Button**: Update audio file lists without restarting
- **Multiple Folders**: Access different audio collections simultaneously

### 3. Supported Audio Formats

The plugin supports these popular audio formats:
- **MP3** (.mp3) - Most compatible format
- **WAV** (.wav) - High quality, uncompressed
- **OGG** (.ogg) - Open source, efficient compression
- **WebM** (.webm) - Web-optimized format
- **M4A** (.m4a) - Apple audio format
- **FLAC** (.flac) - Lossless compression
- **AAC** (.aac) - Advanced Audio Coding

### 4. Audio Controls

#### Playback Controls
- **Play Button**: Starts audio playback from current position
- **Pause Button**: Pauses audio, maintaining current position
- **Stop Function**: Click pause while playing to reset to beginning

#### Volume Control
- **Volume Icon**: Visual indicator for current volume level
- **Volume Slider**: Appears on hover, allows precise volume adjustment (0-100%)
- **Default Volume**: Set in plugin settings (default: 50%)

#### Loop Control
- **Per-Soundboard**: Set `loop: true` in code blocks
- **Global Default**: Configure default looping in settings
- **Manual Control**: Disable looping during playback if needed

### 5. User Interface Features

#### Hover Effects
- **Audio Selectors**: Expand on hover for compact interface
- **Volume Sliders**: Reveal vertical sliders on volume icon hover
- **Visual Feedback**: Smooth transitions and hover states

#### Responsive Design
- **Desktop**: Full functionality with all controls visible
- **Mobile**: Optimized touch interface with simplified controls
- **Adaptive Layout**: Adjusts to different screen sizes

#### Visual Customization
- **Lucide Icons**: Hundreds of icons available for categorization
- **Theme Integration**: Respects Obsidian's light/dark themes
- **Custom Styling**: CSS variables for consistent appearance

### 3. Supported Audio Formats
- MP3 (.mp3)
- WAV (.wav)
- OGG (.ogg)
- WebM (.webm)
- M4A (.m4a)
- FLAC (.flac)
- AAC (.aac)

## Real-World Use Cases

### D&D Campaign Notes
Organize audio for tabletop RPG sessions:

\`\`\`local-soundboard
folder: Audio/D&D/Ambient
icon: castle
title: Dungeon Ambience
loop: true
\`\`\`

\`\`\`local-soundboard
folder: Audio/D&D/Combat
icon: sword
title: Battle Sounds
\`\`\`

\`\`\`local-soundboard
folder: Audio/D&D/Magic
icon: sparkles
title: Spell Effects
\`\`\`

### Study Session Planner
Background music for focused study:

\`\`\`local-soundboard
folder: Music/Study
icon: book-open
title: Study Music
loop: true
\`\`\`

\`\`\`local-soundboard
folder: Audio/Nature/Rain
icon: cloud-rain
title: Rain Sounds
loop: true
\`\`\`

## Configuration

### Quick Start Configuration

The plugin works out-of-the-box with direct folder paths, but you can enhance functionality through settings:

### Settings Overview

Access plugin settings via **Settings → Community Plugins → Local Soundboard**

#### Status Bar Settings
- **Show Status Bar**: Toggle status bar audio controls on/off
- **Folder Management**: Add, edit, and remove audio folders
- **Real-time Updates**: Changes reflect immediately in status bar

#### Folder Configuration
For each folder, you can configure:
- **Display Name**: Human-readable name for the folder
- **Folder Path**: Path relative to vault root
- **Icon**: Lucide icon for visual identification
- **Loop Setting**: Default looping behavior for this folder

#### Default Audio Settings
- **Default Volume**: Set initial volume for new audio controls (0.1 - 1.0)
- **Auto Loop**: Enable looping by default for all soundboards

### Direct Path Usage

No configuration required for basic usage. Simply specify folder paths in code blocks:

\`\`\`local-soundboard
folder: Audio/Sound Effects
\`\`\`

Popular folder structures:
- `folder: Audio/SFX` - Sound effects and foley
- `folder: Music/Ambient` - Background music and atmospheres  
- `folder: Podcasts/Episodes` - Audio podcasts and interviews
- `folder: Voice/Memos` - Voice notes and recordings
- `folder: Production/Samples` - Music production samples

All paths are relative to your vault root directory.

## Icon Library

The plugin uses Lucide icons for visual customization. Here are popular icon choices organized by category:

### Audio & Music
- `music` - Musical note
- `volume-2` - Speaker with sound waves
- `headphones` - Headphone icon
- `mic` - Microphone
- `radio` - Radio receiver
- `speaker` - Simple speaker
- `disc` - CD/vinyl disc
- `guitar` - Guitar icon
- `piano` - Piano keyboard
- `drum` - Drum kit

### Actions & Controls
- `play` - Play button
- `pause` - Pause button

### Finding More Icons
- **Complete Library**: [lucide.dev/icons](https://lucide.dev/icons/)
- **Usage Tips**: 
  - Use exact lowercase names with hyphens
  - Examples: `volume-2`, `tree-pine`, `cloud-rain`
  - Not case-sensitive but lowercase is recommended
  - Test icons in settings to see previews

## Troubleshooting

### Common Issues

#### "Please specify a 'folder' attribute with the folder path"
**Cause**: Missing or incorrectly formatted folder attribute in code block
**Solution**: 
- Ensure you have `folder: path/to/folder` in your code block
- Path should be relative to vault root
- Example: `folder: Audio/SFX`

#### "No audio files found"
**Causes**: 
- Incorrect folder path
- No supported audio files in folder
- Folder doesn't exist

**Solutions**:
- Verify folder path is correct and relative to vault root
- Check that files have supported extensions (.mp3, .wav, .ogg, etc.)
- Use file explorer to confirm folder exists
- Try refreshing the plugin with ribbon icon or command

#### Audio files won't play
**Causes**:
- Browser codec compatibility
- File corruption
- Permission issues

**Solutions**:
- Try different audio formats (MP3 has widest compatibility)
- Test files in external media player
- Check browser developer console for error messages
- Ensure Obsidian has file access permissions

#### Status bar not showing
**Causes**:
- Status bar disabled in settings
- No folders configured
- Plugin needs refresh

**Solutions**:
- Enable "Show Status Bar" in plugin settings
- Add at least one folder in folder management
- Use refresh command or restart Obsidian

#### Icons not displaying
**Causes**:
- Incorrect icon names
- Lucide icon library issues

**Solutions**:
- Use exact Lucide icon names from [lucide.dev/icons](https://lucide.dev/icons/)
- Test with common icons: `music`, `volume-2`, `folder`, `play`
- Check spelling and hyphenation (use hyphens, not spaces)

### Performance Issues

#### Large audio folders
**Solution**: Organize audio files into subfolders for better performance

#### Slow loading
**Solution**: 
- Reduce number of files per folder
- Use compressed audio formats
- Close unused audio tabs

### Getting Help

If you encounter persistent issues:
1. Check Obsidian developer console (Help → Developer → Show Console)
2. Try creating a simple test soundboard
3. Report issues with:
   - Plugin version
   - Obsidian version
   - Operating system
   - Audio format causing issues
   - Error messages from console

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see the [LICENSE](LICENSE) file for details.
