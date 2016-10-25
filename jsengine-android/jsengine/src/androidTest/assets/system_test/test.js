System.register("test", [], function (_export) {
    var Default;
    return {
        execute: function() {
            Default = {
                test: function() {
                    return "test"
                },
                test_object: function() {
                    return {"test": true};
                },
            };
            _export("default", Default);
            _export("testfn", function() { return "fnCalled"; });
        }
    }
});