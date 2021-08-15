// ==UserScript==
// @name         Melvor Idle Auto Loot
// @namespace    http://www.reddit.com/r/melvoridle
// @version      0.1.1
// @description  Melvor Idle Auto Loot for Melvor Idle v0.08.2
// @downloadUrl  https://cdn.jsdelivr.net/gh/BrasilianEngineer/MelvorIdleAutoLoot@master/autoloot.user.js
// @updateUrl    https://cdn.jsdelivr.net/gh/BrasilianEngineer/MelvorIdleAutoLoot@master/autoloot.user.js
// @author       BrasilianEngineer
// @match        *melvoridle.com/*
// @grant        none
// @copyright   2019, BrasilianEngineer
//
//
// Edited to match current version
// ==/UserScript==

(function() {
    'use strict';

    var game;
    var autoLoopTimer;
    var autoLootOptions = {
        gatherCombatLoot: false,
        eatCombatFood: false,
        eatThievingFood: false,
        autoCookingEnabled: false,
        autoRunMode: "",
        autoRunTimer: 5
    }
    var TestTimeout;
    var gameIsRunning = false;

    var runAutomationLoop = function () {
        eatCombatFoodIfNecessary();
        eatThievingFoodIfNecessary();
        gatherCombatLoot();
        cook();
        fire();

        autoLoopTimer = setTimeout(runAutomationLoop, autoLootOptions.autoRunTimer * 1000);
    }

    var eatCombatFoodIfNecessary = function () {
        if (!autoLootOptions.eatCombatFood) return;

        var eatButton = $("#combat-food-container").find("button:first");
        if (!eatButton.is(":visible")) return;


        var hpCurrentLabel = $("#combat-player-hitpoints-current");
        var hpMaxLabel = $("#combat-player-hitpoints-max");
        var max = +hpMaxLabel.text().replace(',','');
        var current = +hpCurrentLabel.text().replace(',','');
        var foodText = eatButton.text().replace(',','');

        foodText = foodText.substr(foodText.indexOf("+") + 1);
        var food = +foodText.substr(0, foodText.length - 3);
        if (max - current >= food) {
            console.log("Eating Attack Food");
            eatButton.click();
        }
    }

    var eatThievingFoodIfNecessary = function () {
        if (!autoLootOptions.eatThievingFood) return;

        var eatButton = $("#thieving-food-container").find("button:first");
        if (!eatButton.is(":visible")) return;

        var hpCurrentLabel = $("#thieving-player-hitpoints-current");
        var hpMaxLabel = $("#thieving-player-hitpoints-max");
        var max = +hpMaxLabel.text().replace(',','');
        var current = +hpCurrentLabel.text().replace(',','');
        var foodText = eatButton.text().replace(',','');
        foodText = foodText.substr(foodText.indexOf("+") + 1);
        var food = +foodText.substr(0, foodText.length - 3);
        console.log(foodText);
        if (max - current >= food) {
            console.log("Eating Thief Food");
            eatButton.click();
        }
    }

    var gatherCombatLoot = function () {
        if (!autoLootOptions.gatherCombatLoot) return;

        var container = $("#combat-loot");
        container.find("button").each(function () {
            console.log("Gathering Loot!");
            $(this).click();
        });
    }

    var cook = function () {
        if (autoLootOptions.autoRunMode !== "cooking") return;
        if (!$("#auto-loot-cook-button").is(":visible")) return;

        // Currently cooking something?
        if ($("#cook-count").text() !== "-") return;

        console.log("Cooking Food");
        $("#auto-loot-cook-button").next().click();
    }

    var fire = function () {
        if (autoLootOptions.autoRunMode !== "fire") return;
        if (!$("#auto-loot-fire-button").is(":visible")) return;

        // Currently cooking something?
        if ($("#skill-fm-burn-progress").width() !== 0) return;

        console.log("Burning Log");
        $("#auto-loot-fire-button").next().click();
    }

    var enableFireButton = function () {
        if ($("#auto-loot-fire-button").length) return;

        var container = $("#skill-fm-burn-progress").parent().parent();
        var button = $('<button type="button" id="auto-loot-fire-button" class="btn btn-block btn-lg btn-info mb-1">Auto Cook</button>');
        container.prepend(button);
        button.on("click", startFire);
    }

    var disableFireButton = function () {
        $("#auto-loot-fire-button").remove();
    }

    function startFire() {
        var button = $("#auto-loot-fire-button");
        if (autoLootOptions.autoRunMode === "fire") {
            autoLootOptions.autoRunMode = "";
            button.addClass("btn-info").removeClass("btn-success")
        } else {
            autoLootOptions.autoRunMode = "fire";
            button.addClass("btn-success").removeClass("btn-info")
        }
    }

    var enableCookingButton = function () {
        if ($("#auto-loot-cook-button").length) return;

        var container = $("#cook-button-qty-all").parent();
        var button = $('<button type="button" id="auto-loot-cook-button" class="btn btn-block btn-info mb-1">Auto Cook</button>');
        container.prepend(button);
        button.on("click", startCooking);
    }

    var disableCookingButton = function () {
        $("#auto-loot-cook-button").remove();
    }

    function startCooking() {
        var button = $("#auto-loot-cook-button");
        if (autoLootOptions.autoRunMode === "cooking") {
            autoLootOptions.autoRunMode = "";
            button.addClass("btn-info").removeClass("btn-success")
        } else {
            autoLootOptions.autoRunMode = "cooking";
            button.addClass("btn-success").removeClass("btn-info")
        }
    }


    var showAutoLootSettings = function () {
        var container = $("#auto-loot-settings-container");
        if (!container.length) {
            container = renderAutoLootSettings();
        }
        if (container.is(":visible")) {
            container.hide();
        } else {
            container.show();
            syncSettingButtons();
        }
    }

    var hideAutoLootSettings = function () {
        var container = $("#auto-loot-settings-container");
        container.hide();
    }

    var toggleAutoLootSetting = function () {
        var setting = $(this).data("setting");
        var active = autoLootOptions[setting];
        active = !active;
        autoLootOptions[setting] = active;
        if (active) {
            $(this).removeClass("btn-outline-primary").addClass("btn-primary");
        } else {
            $(this).removeClass("btn-primary").addClass("btn-outline-primary");
        }

        // Enable/Disable Relevant Buttons
        if (autoLootOptions.autoCookingEnabled) {
            enableCookingButton();
        } else {
            disableCookingButton();
        }
        if (autoLootOptions.autoFireEnabled) {
            enableFireButton();
        } else {
            disableFireButton();
        }
    }

    var syncSettingButtons = function () {
        $("#auto-loot-enabled-settings").find("button").each(function() {
            var btn = $(this);
            var active = autoLootOptions[btn.data("setting")];
            if (active) {
                btn.removeClass("btn-outline-primary").addClass("btn-primary");
            } else {
                btn.removeClass("btn-primary").addClass("btn-outline-primary");
            }
        });
        $("#auto-loot-run-count").val(autoLootOptions.autoRunTimer);
    }

    var renderAutoLootSettings = function () {
        var html = [
            '<div id="auto-loot-settings-container" style="display: none">',
            '<div class="row row-deck">',
            '<div class="col-md-12">',
            '<div class="block block-rounded block-link-pop border-top border-settings border-4x">',
            '<div class="block-content">',
            '<h2 class="content-heading border-bottom mb-4 pb-2">Auto Loot Settings <a class="float-right" href="javascript:void(0)" id="auto-loot-settings-close">X</a></h2>',

            '<div class="row push">',
            '<div class="col-3">',
            '<p class="font-size-sm text-muted">Enabled Features</p>',
            '</div>',
            '<div class="col-9" id="auto-loot-enabled-settings">',
            '<button type="button" data-setting="gatherCombatLoot" class="btn btn-outline-primary js-tooltip-enabled auto-loot-button" data-toggle="tooltip" data-html="true" data-placement="bottom" title="Gather all loot from Combat!"><img src="assets/media/main/bank_header.svg" height="32px" width="32px"></button>',
            '<button type="button" data-setting="eatCombatFood" class="btn btn-outline-primary js-tooltip-enabled auto-loot-button" data-toggle="tooltip" data-html="true" data-placement="bottom" title="Eat food to replenish your health during combat!"><img src="assets/media/skills/combat/attack.svg" height="32px" width="32px"><img src="assets/media/shop/autoeat.svg" height="32px" width="32px"></button>',
            '<button type="button" data-setting="eatThievingFood" class="btn btn-outline-primary js-tooltip-enabled auto-loot-button" data-toggle="tooltip" data-html="true" data-placement="bottom" title="Eat food to replenish your health during thieving!"><img src="assets/media/skills/thieving/thieving.svg" height="32px" width="32px"><img src="assets/media/shop/autoeat.svg" height="32px" width="32px"></button>',
            '<button type="button" data-setting="autoCookingEnabled" class="btn btn-outline-primary js-tooltip-enabled auto-loot-button" data-toggle="tooltip" data-html="true" data-placement="bottom" title="Enable Auto Cooking. (This makes the milestone pointless, so it is up to you to determine whether that is too cheaty!)"><img src="assets/media/skills/cooking/cooking.svg" height="32px" width="32px"></button>',
            '<button type="button" data-setting="autoFireEnabled" class="btn btn-outline-primary js-tooltip-enabled auto-loot-button" data-toggle="tooltip" data-html="true" data-placement="bottom" title="Enable Auto Firemaking. (This makes the milestone pointless, so it is up to you to determine whether that is too cheaty!)"><img src="assets/media/skills/firemaking/firemaking.svg" height="32px" width="32px"></button>',
            '</div>',
            '</div>',

            '<div class="row push">',
            '<div class="col-3">',
            '<p class="font-size-sm text-muted">Frequency</p>',
            '</div>',
            '<div class="col-3" id="auto-loot-enabled-settings">',
            '<div class="input-group">',
            '<input type="number" id="auto-loot-run-count" min="0" max="300" class="form-control">',
            '<div class="input-group-append">',
            '<button type="button" id="auto-loot-run-start" class="btn btn-primary">Start</button>',
            '</div>',
            '</div>',
            '</div>',
            '</div>',
            '</div>',
            '</div>',
            '</div>',
            '</div>',
            '</div>'
        ].join("");

        var container = $(html);
        $("#main-container").prepend(container);
        $(".auto-loot-button").on("click", toggleAutoLootSetting);
        $(".auto-loot-button").tooltip()
        $("#auto-loot-run-start").on("click", setRunTimerSetting);
        $("#auto-loot-settings-close").on("click", hideAutoLootSettings);
        return container;
    }

    var setRunTimerSetting = function () {
        var value = +$("#auto-loot-run-count").val();
        $("#auto-loot-run-start").text("Update");
        autoLootOptions.autoRunTimer = value;
        startAutoLoop();
    }

    var renderHeaderButton = function () {
        if ($("#auto-loot-settings-button").length) return;

        var containerRef = $(".content-side ul.nav-main li.nav-main-heading:last");

        var li = $('<li class="nav-main-item"></li>');
        containerRef.before(li);
        var button = $([
            '<a id="#auto-loot-settings-button" class="nav-main-link" href="javascript:void(0);">',
            '<img class="nav-img" src="assets/media/main/question.svg">',
            '<span class="nav-main-link-name">AutoLoot Settings</span>',
            '</a>'
        ].join(""));
        li.append(button);
        button.on("click", showAutoLootSettings);
    }

    var startAutoLoop = function () {
        if (autoLoopTimer) {
            clearTimeout(autoLoopTimer);
        }

        runAutomationLoop();
    }
	var loadTest = function() {
       if ($("#page-header-user-dropdown").length === 0 || !$("#page-header-user-dropdown").is(":visible")) {
           // Test if  game is already loaded or wait 2s and try again
            setTimeout(function(){
                loadTest();
            }, 2000);
           console.log("Game not loaded, waiting...");
       } else {
           // Game loaded, init auto loot
           console.log("Loaded, now rendering");
           renderHeaderButton();
        }
    }

    loadTest();
})();
