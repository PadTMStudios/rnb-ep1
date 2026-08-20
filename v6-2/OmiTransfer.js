/*:
 * @plugindesc Omi transfer system for RouxnoBlue
 * @author PadTM Studios
 *
 * @help
 * Usage in events:
 *   Script: TransferSystem.exportParty();
 *
 * This will generate the file transfer.json in the root folder of the project.
 */

var TransferSystem = TransferSystem || {};

(function() {
  const fs = require('fs');
  const path = require('path');
  const basePath = path.dirname(process.mainModule.filename);

  const excludedById = [1,2,3,4,6,11]; 
  const excludedByName = ["Roux","Masumi","Marth","Cat-mo","Kite","The Seller"];

  TransferSystem.exportParty = function() {
    let exportedActors = [];

    $gameParty.members().forEach(actor => {
      const id = actor.actorId();
      const name = actor.name();

      if (excludedById.indexOf(id) === -1 && !excludedByName.includes(name)) {
        exportedActors.push({
          id: id,
          name: name,
          level: actor.level,
          hp: actor.hp,
          mp: actor.mp
        });
      } else {
        console.log("Excluded actor: " + name + " (ID " + id + ")");
      }
    });

    fs.writeFileSync(basePath + '/transfer.json', JSON.stringify(exportedActors, null, 2));
    $gameMessage.add("Your Omi have been sent successfully");
  };

})();
