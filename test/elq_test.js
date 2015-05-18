/* global describe:false, it:false, expect:false, Elq:false, jasmine: false, _:false */

"use strict";

function createDummyPlugin(name, make) {
    var makeFunction = make;

    if(!_.isFunction(make)) {
        makeFunction = function() {
            return make;
        };
    }

    var dummyPlugin = {
        getName: function() {
            return name;
        },
        getVersion: function() {
            return "1.33.7";
        },
        isCompatible: function() {
            return true;
        },
        make: makeFunction
    };

    return dummyPlugin;
}

describe("elq", function() {
    describe("Public API", function() {
        it("getName should return the name of the isntance", function() {
            var elq = Elq();
            var name = elq.getName();
            expect(name).toEqual("elq"); //TODO: This should be checked against the package.json file.
        });

        it("getVersion should return the version of the instance", function() {
            var elq = Elq();
            var version = elq.getVersion();
            expect(version).toEqual("0.1.1"); //TODO: This should be checked against the package.json file.
        });

        describe("use", function() {
            it("should be able to register plugins", function() {
                function checkPluginApi(elq) {
                    expect(elq.getVersion).toEqual(jasmine.any(Function));
                    expect(elq.getName).toEqual(jasmine.any(Function));
                    expect(elq.use).toEqual(jasmine.any(Function));
                    expect(elq.using).toEqual(jasmine.any(Function));
                    expect(elq.start).toEqual(jasmine.any(Function));
                    expect(elq.listenTo).toEqual(jasmine.any(Function));
                    expect(elq.idHandler).toEqual(jasmine.any(Object));
                    expect(elq.reporter).toEqual(jasmine.any(Object));
                    expect(elq.cycleDetector).toEqual(jasmine.any(Object));
                    expect(elq.createBatchUpdater).toEqual(jasmine.any(Function));
                    expect(elq.getPlugin).toEqual(jasmine.any(Function));
                }

                var elq;
                var myPluginInstance;

                var myPlugin = {
                    getName: function() {
                        return "my-plugin";
                    },
                    getVersion: function() {
                        return "9.1.4";
                    },
                    isCompatible: function(elq) {
                        checkPluginApi(elq);
                        return true;
                    },
                    make: function(elq, options) {
                        checkPluginApi(elq);
                        return {
                            foo: function() {
                                options = options || {};
                                return elq.getName() + options.test;
                            }
                        };
                    }
                };

                spyOn(myPlugin, "getName").and.callThrough();
                spyOn(myPlugin, "getVersion").and.callThrough();
                spyOn(myPlugin, "isCompatible").and.callThrough();
                spyOn(myPlugin, "make").and.callThrough();

                //No options.
                elq = Elq();
                myPluginInstance = elq.use(myPlugin);
                expect(myPlugin.getName).toHaveBeenCalled();
                expect(myPlugin.isCompatible).toHaveBeenCalledWith(jasmine.any(Object));
                expect(myPlugin.make).toHaveBeenCalledWith(jasmine.any(Object), undefined);
                expect(myPluginInstance).toEqual(jasmine.any(Object));
                expect(myPluginInstance.foo()).toEqual(elq.getName() + undefined);

                //Plugin make options.
                elq = Elq();
                var options = {
                    test: "something"
                };
                myPluginInstance = elq.use(myPlugin, options);
                expect(myPlugin.getName).toHaveBeenCalled();
                expect(myPlugin.isCompatible).toHaveBeenCalledWith(jasmine.any(Object));
                expect(myPlugin.make).toHaveBeenCalledWith(jasmine.any(Object), options);
                expect(myPluginInstance).toEqual(jasmine.any(Object));
                expect(myPluginInstance.foo()).toEqual(elq.getName() + options.test);

                //Incompatible plugins should not be registered.
                elq = Elq({
                    reporter: {
                        error: function noop() {} //Squelch reporter error output.
                    }
                });
                myPlugin.isCompatible = function() {
                    return false;
                }
                expect(function() {
                    myPluginInstance = elq.use(myPlugin);
                }).toThrow();
            });
        });

        describe("using", function() {
            it("should tell if a plugin is being used or not, by string or plugin definition", function() {
                var elq;

                var myPlugin = createDummyPlugin("my-plugin", {});

                var elq = Elq();
                expect(elq.using(myPlugin)).toEqual(false);
                expect(elq.using(myPlugin.getName())).toEqual(false);
                elq.use(myPlugin);
                expect(elq.using(myPlugin)).toEqual(true);
                expect(elq.using(myPlugin.getName())).toEqual(true);
            });
        });

        it("start should call all plugins that have a start method", function() {
            var elq;
            var elements;

            var myPlugin = createDummyPlugin("my-plugin", {
                start: function(elements) {}
            });

            var myOtherPlugin = createDummyPlugin("my-other-plugin", {
                start: function(elements) {}
            });

            var myOtherExtraPlugin = createDummyPlugin("my-other-extra-plugin", {});

            elq = Elq();

            var myPluginInstance = elq.use(myPlugin);
            var myOtherPluginInstance = elq.use(myOtherPlugin);
            var myOtherExtraPlugininstance = elq.use(myOtherExtraPlugin);

            spyOn(myPluginInstance, "start");
            spyOn(myOtherPluginInstance, "start");

            //Note that elements here can be anything. Not using strings because they are also enumerable, which makes the testing a bit hard.

            //Called with array.
            elements = [11, 22, 33, 44];
            elq.start(elements);
            expect(myPluginInstance.start).toHaveBeenCalledWith(elements);
            expect(myOtherPluginInstance.start).toHaveBeenCalledWith(elements);
            myPluginInstance.start.calls.reset();
            myOtherPluginInstance.start.calls.reset();

            //Called with single element.
            elq.start(11);
            expect(myPluginInstance.start).toHaveBeenCalled();
            expect(myOtherPluginInstance.start).toHaveBeenCalled();
            expect(myPluginInstance.start.calls.argsFor(0)[0]).toEqual([11]);
            expect(myOtherPluginInstance.start.calls.argsFor(0)[0]).toEqual([11]);
            myPluginInstance.start.calls.reset();
            myOtherPluginInstance.start.calls.reset();

            //Called with an enumerable object.
            elements = {
                length: 4,
                0: 11,
                1: 22,
                2: 33,
                3: 44
            };
            elq.start(elements);
            expect(myPluginInstance.start).toHaveBeenCalled();
            expect(myOtherPluginInstance.start).toHaveBeenCalled();
            expect(myPluginInstance.start.calls.argsFor(0)[0]).toEqual(elements);
            expect(myOtherPluginInstance.start.calls.argsFor(0)[0]).toEqual(elements);
            //TODO: Might be changed to this desired behavior:
            //expect(myPluginInstance.start.calls.argsFor(0)).toEqual([11, 22, 33, 44]);
            //expect(myOtherPluginInstance.start.calls.argsFor(0)).toEqual([11, 22, 33, 44]);
        });

        it("listenTo should be defined", function() {
            var elq = Elq();
            //Not tested more since this is a delegated function to the element-resize-detector project.
            expect(elq.listenTo).toEqual(jasmine.any(Function));
        });
    });

    describe("Plugin API", function() {

    });
});