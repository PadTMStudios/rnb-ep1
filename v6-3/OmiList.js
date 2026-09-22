/*:
 * @plugindesc RouxnoPedia
 * @author PadTM Studios
 * @help
 * ----------------------------------------------------------------------------
 * Actors with an ID less than minOmiId are considered HUMAN. 
 * Actors with an ID greater than or equal to minOmiId are considered OMI.
 * ----------------------------------------------------------------------------
 * PLUGIN COMMAND:
 *   $gameOmiDex.registerOmi(ID);
 */

var Imported = Imported || {};
Imported.OmiDexMenu = true;

var OmiDex = OmiDex || {};
OmiDex.minOmiId = 4; // minOmiId

// ----------------------------------------------------------------------------
// IDs
// ----------------------------------------------------------------------------
// Humans & discarded Omi:
OmiDex.excludedIds = [6, 10, 11, 14, 16, 17, 18, 19, 20, 21, 22]; 

OmiDex.customDisplayIds = {
    13: 1,
    5: 2,
    4: 3,
    7: 4,
    8: 5,
    9: 6,
    15: 7,
    12: 8
};

// ============================================================================
// 1. Data Management and Save Persistence
// ============================================================================

var $gameOmiDex = null;

var _DataManager_createGameObjects = DataManager.createGameObjects;
DataManager.createGameObjects = function() {
    _DataManager_createGameObjects.call(this);
    $gameOmiDex = new Game_OmiDex();
};

var _DataManager_makeSaveContents = DataManager.makeSaveContents;
DataManager.makeSaveContents = function() {
    var contents = _DataManager_makeSaveContents.call(this);
    contents.omiDex = $gameOmiDex;
    return contents;
};

var _DataManager_extractSaveContents = DataManager.extractSaveContents;
DataManager.extractSaveContents = function(contents) {
    _DataManager_extractSaveContents.call(this, contents);
    $gameOmiDex = contents.omiDex || new Game_OmiDex();
};

function Game_OmiDex() {
    this.initialize.apply(this, arguments);
}

Game_OmiDex.prototype.initialize = function() {
    this._capturedOmis = [];
};

Game_OmiDex.prototype.registerOmi = function(actorId) {
    if (!this._capturedOmis) this._capturedOmis = [];
    
    if (actorId >= OmiDex.minOmiId && !this.isCaptured(actorId)) {
        this._capturedOmis.push(actorId);
        SoundManager.playOk();
    }
};

Game_OmiDex.prototype.isCaptured = function(actorId) {
    if (!this._capturedOmis) return false;
    return this._capturedOmis.contains(actorId);
};

// ============================================================================
// 2. PLUGIN COMMAND AND MAIN MENU BUTTON
// ============================================================================

var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function(command, args) {
    _Game_Interpreter_pluginCommand.call(this, command, args);
    if (command === 'OpenOmiDex') {
        SceneManager.push(Scene_OmiDex);
    }
};

// Menu Button
var _Window_MenuCommand_addOriginalCommands = Window_MenuCommand.prototype.addOriginalCommands;
Window_MenuCommand.prototype.addOriginalCommands = function() {
    _Window_MenuCommand_addOriginalCommands.call(this);
    this.addCommand("RouxnoPedia", "omiDex", true);
};

//Press Button
var _Scene_Menu_createCommandWindow = Scene_Menu.prototype.createCommandWindow;
Scene_Menu.prototype.createCommandWindow = function() {
    _Scene_Menu_createCommandWindow.call(this);
    this._commandWindow.setHandler("omiDex", this.commandOmiDex.bind(this));
};

Scene_Menu.prototype.commandOmiDex = function() {
    SceneManager.push(Scene_OmiDex);
};

// ============================================================================
// 3. Omi List
// ============================================================================

function Window_OmiList() {
    this.initialize.apply(this, arguments);
}

Window_OmiList.prototype = Object.create(Window_Selectable.prototype);
Window_OmiList.prototype.constructor = Window_OmiList;

Window_OmiList.prototype.initialize = function(x, y, width, height) {
    Window_Selectable.prototype.initialize.call(this, x, y, width, height);
    this._index = 0;
    this.refresh();
    this.select(0);
    this.activate();
};

Window_OmiList.prototype.maxItems = function() {
    return this._omiList ? this._omiList.length : 0;
};

Window_OmiList.prototype.item = function() {
    return this._omiList ? this._omiList[this.index()] : null;
};

Window_OmiList.prototype.refresh = function() {
    this._omiList = [];
    if ($dataActors) {
        for (var i = 1; i < $dataActors.length; i++) {
            var actor = $dataActors[i];
            
            // Check minimum ID and exclusion list.
            if (actor && actor.id >= OmiDex.minOmiId) {
                var isExcluded = OmiDex.excludedIds && OmiDex.excludedIds.indexOf(actor.id) !== -1;
                if (!isExcluded) {
                    this._omiList.push(actor);
                }
            }
        }

        // SORTING: Reorganizes the list from lowest to highest based on customDisplayIds.
        this._omiList.sort(function(a, b) {
            var displayA = (OmiDex.customDisplayIds && OmiDex.customDisplayIds[a.id] !== undefined) ? OmiDex.customDisplayIds[a.id] : a.id;
            var displayB = (OmiDex.customDisplayIds && OmiDex.customDisplayIds[b.id] !== undefined) ? OmiDex.customDisplayIds[b.id] : b.id;
            return displayA - displayB;
        });
    }
    this.createContents();
    Window_Selectable.prototype.refresh.call(this);
};

Window_OmiList.prototype.drawItem = function(index) {
    var actor = this._omiList[index];
    if (!actor) return;
    
    var rect = this.itemRect(index);
    rect.width -= this.textPadding();
    
    var displayId = (OmiDex.customDisplayIds && OmiDex.customDisplayIds[actor.id] !== undefined) ? OmiDex.customDisplayIds[actor.id] : actor.id;
    var idText = displayId.padZero(3);

    if ($gameOmiDex && $gameOmiDex.isCaptured(actor.id)) {
        this.drawText(idText + ": " + actor.name, rect.x, rect.y, rect.width);
    } else {
        this.drawText(idText + ": ?????????", rect.x, rect.y, rect.width);
    }
};

Window_OmiList.prototype.setStatusWindow = function(statusWindow) {
    this._statusWindow = statusWindow;
    this.updateStatus();
};

Window_OmiList.prototype.select = function(index) {
    Window_Selectable.prototype.select.call(this, index);
    this.updateStatus();
};

Window_OmiList.prototype.updateStatus = function() {
    if (this._statusWindow) {
        var actor = this.item();
        this._statusWindow.setActor(actor);
    }
};

// ============================================================================
// 4. PROFILE WINDOW
// ============================================================================

function Window_OmiStatus() {
    this.initialize.apply(this, arguments);
}

Window_OmiStatus.prototype = Object.create(Window_Base.prototype);
Window_OmiStatus.prototype.constructor = Window_OmiStatus;

Window_OmiStatus.prototype.initialize = function(x, y, width, height) {
    Window_Base.prototype.initialize.call(this, x, y, width, height);
    this._actor = null;
    this.refresh();
};

Window_OmiStatus.prototype.setActor = function(actor) {
    if (this._actor !== actor) {
        this._actor = actor;
        this.refresh();
    }
};

Window_OmiStatus.prototype.refresh = function() {
    this.contents.clear();
    if (!this._actor) return;

    var actorId = this._actor.id;
    if ($gameOmiDex && $gameOmiDex.isCaptured(actorId)) {
        var omiClass = (this._actor.meta && this._actor.meta.ClaseOmi) ? this._actor.meta.ClaseOmi : "Unknown";
        
        this.drawText("Name: " + this._actor.name, 20, 20);
        this.drawText("Type: " + omiClass, 20, 60);
        this.drawText("Profile:", 20, 100);
        
        var profileText = this._actor.profile || "No data.";
        var maxWidth = this.contentsWidth() - 40;
        var lines = this.wrapText(profileText, maxWidth);
        
        for (var i = 0; i < lines.length; i++) {
            this.drawText(lines[i], 20, 140 + (i * 36));
        }
    } else {
        this.drawText("No data available", 20, 20);
        this.drawText("Keep exploring!", 20, 60);
    }
};

// Function to split the text into multiple lines if it exceeds the window width
Window_OmiStatus.prototype.wrapText = function(text, maxWidth) {
    var rawLines = text.split('\n');
    var formattedLines = [];

    for (var j = 0; j < rawLines.length; j++) {
        var words = rawLines[j].split(' ');
        var currentLine = '';

        for (var i = 0; i < words.length; i++) {
            var testLine = currentLine + (currentLine ? ' ' : '') + words[i];
            var testWidth = this.textWidth(testLine);

            if (testWidth > maxWidth && currentLine !== '') {
                formattedLines.push(currentLine);
                currentLine = words[i];
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) {
            formattedLines.push(currentLine);
        }
    }
    return formattedLines;
};

// ============================================================================
// 5. RouxnoPedia
// ============================================================================

function Scene_OmiDex() {
    this.initialize.apply(this, arguments);
}

Scene_OmiDex.prototype = Object.create(Scene_MenuBase.prototype);
Scene_OmiDex.prototype.constructor = Scene_OmiDex;

Scene_OmiDex.prototype.initialize = function() {
    Scene_MenuBase.prototype.initialize.call(this);
};

Scene_OmiDex.prototype.create = function() {
    Scene_MenuBase.prototype.create.call(this);
    this.createBackground();
    this.createWindowLayer();
    this.createOmiWindows();
};

Scene_OmiDex.prototype.createOmiWindows = function() {
    var listWidth = 360;
    var listHeight = Graphics.boxHeight;
    this._omiListWindow = new Window_OmiList(0, 0, listWidth, listHeight);
    this._omiListWindow.setHandler('cancel', this.popScene.bind(this));
    this.addWindow(this._omiListWindow);

    var statusX = listWidth;
    var statusWidth = Graphics.boxWidth - listWidth;
    var statusHeight = Graphics.boxHeight;
    this._omiStatusWindow = new Window_OmiStatus(statusX, 0, statusWidth, statusHeight);
    this.addWindow(this._omiStatusWindow);

    this._omiListWindow.setStatusWindow(this._omiStatusWindow);
};