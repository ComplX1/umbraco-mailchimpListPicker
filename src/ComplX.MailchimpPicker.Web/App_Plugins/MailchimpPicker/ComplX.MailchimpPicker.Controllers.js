"use strict";

function mailchimpListPickerController($scope, entityResource, editorState, iconHelper, $routeParams, angularHelper, navigationService, $location, miniEditorHelper, localizationService, mailchimpPickerResource) {
    var unsubscribe;
    function subscribe() {
        unsubscribe = $scope.$on('formSubmitting', function (ev, args) {
            var currIds = _.map($scope.renderModel, function (i) {
                return $scope.model.config.idType === 'udi' ? i.udi : i.id;
            });
            $scope.model.value = trim(currIds.join(), ',');
        });
    }
    function trim(str, chr) {
        var rgxtrim = !chr ? new RegExp('^\\s+|\\s+$', 'g') : new RegExp('^' + chr + '+|' + chr + '+$', 'g');
        return str.replace(rgxtrim, '');
    }
    function startWatch() {
        //We need to watch our renderModel so that we can update the underlying $scope.model.value properly, this is required
        // because the ui-sortable doesn't dispatch an event after the digest of the sort operation. Any of the events for UI sortable
        // occur after the DOM has updated but BEFORE the digest has occured so the model has NOT changed yet - it even states so in the docs.
        // In their source code there is no event so we need to just subscribe to our model changes here.
        //This also makes it easier to manage models, we update one and the rest will just work.
        $scope.$watch(function () {
            //return the joined Ids as a string to watch
            return _.map($scope.renderModel, function (i) {
                return $scope.model.config.idType === 'udi' ? i.udi : i.id;
            }).join();
        }, function (newVal) {
            var currIds = _.map($scope.renderModel, function (i) {
                return $scope.model.config.idType === 'udi' ? i.udi : i.id;
            });
            $scope.model.value = trim(currIds.join(), ',');
            //Validate!
            if ($scope.model.config && $scope.model.config.minNumber && parseInt($scope.model.config.minNumber) > $scope.renderModel.length) {
                $scope.contentPickerForm.minCount.$setValidity('minCount', false);
            } else {
                $scope.contentPickerForm.minCount.$setValidity('minCount', true);
            }
            if ($scope.model.config && $scope.model.config.maxNumber && parseInt($scope.model.config.maxNumber) < $scope.renderModel.length) {
                $scope.contentPickerForm.maxCount.$setValidity('maxCount', false);
            } else {
                $scope.contentPickerForm.maxCount.$setValidity('maxCount', true);
            }
            setSortingState($scope.renderModel);
        });
    }
    $scope.renderModel = [];
    $scope.dialogEditor = editorState && editorState.current && editorState.current.isDialogEditor === true;
    //the default pre-values
    var defaultConfig = {
        multiPicker: false,
        showPathOnHover: false,
        dataTypeId: null,
        maxNumber: 1,
        minNumber: 0,
        startNode: {
            query: '',
            type: 'content',
            id: $scope.model.config.startNodeId ? $scope.model.config.startNodeId : -1    // get start node for simple Content Picker
        }
    };
    // sortable options
    $scope.sortableOptions = {
        axis: 'y',
        containment: 'parent',
        distance: 10,
        opacity: 0.7,
        tolerance: 'pointer',
        scroll: true,
        zIndex: 6000,
        update: function (e, ui) {
            angularHelper.getCurrentForm($scope).$setDirty();
        }
    };
    if ($scope.model.config) {
        //merge the server config on top of the default config, then set the server config to use the result
        $scope.model.config = angular.extend(defaultConfig, $scope.model.config);
    }

    var entityType = 'Document';
    $scope.allowRemoveButton = true;
    //the dialog options for the picker
    var dialogOptions = {
        entityType: entityType,
        filterCssClass: 'not-allowed not-published',
        startNodeId: null,
        currentNode: editorState ? editorState.current : null,
        callback: function (data) {
            if (angular.isArray(data)) {
                _.each(data, function (item, i) {
                    $scope.add(item);
                });
            } else {
                $scope.clear();
                $scope.add(data);
            }
            angularHelper.getCurrentForm($scope).$setDirty();
        },
        treeAlias: $scope.model.config.startNode.type,
        section: $scope.model.config.startNode.type,
        idType: 'int'
    };
    //since most of the pre-value config's are used in the dialog options (i.e. maxNumber, minNumber, etc...) we'll merge the
    // pre-value config on to the dialog options
    angular.extend(dialogOptions, $scope.model.config);
    //dialog
    $scope.openContentPicker = function () {
        $scope.contentPickerOverlay = dialogOptions;
        $scope.contentPickerOverlay.view = '../App_Plugins/MailchimpPicker/views/dialogs/MailchimpPicker.html';
        $scope.contentPickerOverlay.show = true;
        $scope.contentPickerOverlay.dataTypeId = $scope.model && $scope.model.dataTypeId ? $scope.model.dataTypeId : null;
        $scope.contentPickerOverlay.submit = function (model) {
            if (angular.isArray(model.selection)) {
                _.each(model.selection, function (item, i) {
                    $scope.add(item);
                });
                angularHelper.getCurrentForm($scope).$setDirty();
            }
            $scope.contentPickerOverlay.show = false;
            $scope.contentPickerOverlay = null;
        };
        $scope.contentPickerOverlay.close = function (oldModel) {
            $scope.contentPickerOverlay.show = false;
            $scope.contentPickerOverlay = null;
        };
    };
    $scope.remove = function (index) {
        $scope.renderModel.splice(index, 1);
        angularHelper.getCurrentForm($scope).$setDirty();
    };
    $scope.add = function (item) {
        var currIds = _.map($scope.renderModel, function (i) {
            return $scope.model.config.idType === 'udi' ? i.udi : i.id;
        });
        var itemId = $scope.model.config.idType === 'udi' ? item.udi : item.id;
        if (currIds.indexOf(itemId) < 0) {
            addSelectedItem(item);
        }
    };
    $scope.clear = function () {
        $scope.renderModel = [];
    };
    //when the scope is destroyed we need to unsubscribe
    $scope.$on('$destroy', function () {
        if (unsubscribe) {
            unsubscribe();
        }
    });
    //load current data if anything selected
    if ($scope.model.value !== "") {
        mailchimpPickerResource.getList($scope.model.value).then(function (result) {
            addSelectedItem(result.data);

            startWatch();
            subscribe();
        });
    } else {
        //everything is loaded, start the watch on the model
        startWatch();
        subscribe();
    }
    function addSelectedItem(item) {
        // set icon
        if (item.icon) {
            item.icon = iconHelper.convertFromLegacyIcon(item.icon);
        }
        $scope.renderModel.push({
            'name': item.name,
            'id': item.id,
            'udi': item.udi,
            'icon': item.icon,
            'path': item.path,
            'url': item.url,
            'trashed': item.trashed,
            'published': item.metaData && item.metaData.IsPublished === false && entityType === 'Document' ? false : true    // only content supports published/unpublished content so we set everything else to published so the UI looks correct
        });
    }
    function setSortingState(items) {
        // disable sorting if the list only consist of one item
        if (items.length > 1) {
            $scope.sortableOptions.disabled = false;
        } else {
            $scope.sortableOptions.disabled = true;
        }
    }
}
angular.module('umbraco').controller('ComplX.propertyEditors.mailchimpPickerController', ['$scope', 'entityResource', 'editorState', 'iconHelper', '$routeParams', 'angularHelper', 'navigationService', '$location', 'miniEditorHelper', 'localizationService', 'ComplX.MailchimpPicker.Resource', mailchimpListPickerController]);

function mailchimpOverlayController($scope, eventsService, mailchimpPickerResource) {
    $scope.eventhandler = $({});
    $scope.mailingLists = [];
    $scope.model.selection = [];

    mailchimpPickerResource.getLists().then(function (result) {
        $scope.mailingLists = result.data;
    }, function(result) {
		if (result.status === 403) { 
			$scope.apiError = true;
		}
	});

    //wires up selection
    function nodeSelectHandler(ev, args) {
        args.event.preventDefault();
        args.event.stopPropagation();

        eventsService.emit('dialogs.treePickerController.select', args);
        if (args.node.filtered) {
            return;
        }
        //This is a tree node, so we don't have an entity to pass in, it will need to be looked up
        //from the server in this method.
        if ($scope.model.select) {
            $scope.model.select(args.node);
        } else {
            select(args.node);
            //toggle checked state
            args.node.selected = args.node.selected === true ? false : true;
        }
    }

    /** Method used for selecting a node */
    function select(entity) {
        $scope.model.selection.push(entity);
        $scope.model.submit($scope.model);
    }

    $scope.eventhandler.bind('treeNodeSelect', nodeSelectHandler);
}
angular.module('umbraco').controller('ComplX.Overlays.mailchimpOverlayController', ['$scope', 'eventsService', 'ComplX.MailchimpPicker.Resource', mailchimpOverlayController]);