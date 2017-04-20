var app = angular.module('app', ['ui.router', 'LocalStorageModule']);

app.run(['getCarListService', function(getCarListService) {
    getCarListService.getList();
}]);

app.config(['$stateProvider', '$locationProvider', '$urlRouterProvider',
    function($stateProvider, $locationProvider, $urlRouterProvider){

        $locationProvider.html5Mode(true);

        $stateProvider
            .state('step1', {
                url: '/',
                templateUrl: 'js/templates/step1.html',
                controller: 'stepFirstController'
            })
            .state('step2', {
                url: '/step2',
                templateUrl: 'js/templates/step2.html',
                controller: 'stepSecondController'
            });

        $urlRouterProvider.otherwise('/');
    }]
);


app.service('getCarListService', ['$http', 'localStorageService', function ($http, localStorageService) {

    var getCarListService = {};
    var _getData = {
        data: ''
    };

    var _getList = function(){

        var localData = localStorageService.get('listData');
        if(localData) {
             _getData.data = localData;
        } else {
            _getServerList();
        }

    };

    var _getServerList = function(){
        return $http.get('../data.json').then(function(response){
            localStorageService.set('listData', response.data);
            _getList();

        }).catch(function(err){
            console.log(err);
        });

    };

    getCarListService.getData = _getData;
    getCarListService.getList = _getList;

    return getCarListService;


}]);

app.controller('stepFirstController', ['$rootScope', '$scope', 'getCarListService', 'localStorageService',
    function($rootScope, $scope, getCarListService, localStorageService){

    var selectedItems = [];
    $scope.show = true;


    var submitItem = $rootScope.$on('submitItem', function(event, item){

        selectedItems = localStorageService.get('selectItem');
        if(localStorageService.get('selectItem') == null){
            selectedItems = [];
        }
        selectedItems.push(item);
        localStorageService.set('selectItem', selectedItems);
        $scope.selectList = selectedItems;
    });


    $scope.$on('$destroy', submitItem);

    $rootScope.$on('removeItem', function(){
        localStorageService.set('selectItem', $scope.selectList);
    });

    $scope.selectList = localStorageService.get('selectItem');
    $scope.items = getCarListService.getData.data;


}]);


app.controller('stepSecondController', ['$scope', 'localStorageService', '$http',
    function($scope, localStorageService, $http){

    $scope.saveList = localStorageService.get('saveList');

    $scope.submitData = function(){
        $http.post('localhost', $scope.saveList).then(function(response){
            console.log(response);
        }).catch(function(err){
            console.log(err);
        })
    }

}]);


app.directive('list', function($rootScope, localStorageService){
    return {
        scope: {
            object: '=',
            visible: '='
        },
        restrict: 'E',
        templateUrl: 'js/templates/directive-templates/list-item.html',

        link: function(scope, element, attrs){

            var selectItem = localStorageService.get('selectItem');

            if(selectItem){
                selectItem.forEach(function(item){
                    if(scope.object.title == item.item.title){
                        scope.visible = false;
                    }
                });
            }

            scope.hide = function(){
                scope.visible = false;
                console.log(this);
                $rootScope.$emit('submitItem', {item: this.$parent.item});
            };

            $rootScope.$on('removeItem', function(event, item){

                if(scope.object.title == item.item){
                    scope.visible = true;
                }
            })


        }
    }
});

app.directive('selectList', function($rootScope, $state, localStorageService){
    return{
        restrict: 'E',
        templateUrl: 'js/templates/directive-templates/box-list.html',

        link: function(scope, element, attrs){

            scope.remove = function(){
                var self = this,
                    listArray = this.$parent.selectList;

                listArray.forEach(function(item){
                    if(item == self.select){
                        var indexOf = listArray.indexOf(item);
                        listArray.splice(indexOf, 1);
                    }
                });

                $rootScope.$broadcast('removeItem', {item: this.select.item.title})
            };

            scope.saveList = function(){
                $state.go('step2');
                localStorageService.set('saveList', this.selectList);
            }

        }
    }
});

