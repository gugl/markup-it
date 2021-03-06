var MarkupIt = require('../');
var mock = require('./mock');

describe('JSONUtils', function() {

    describe('decode', function() {
        var content = MarkupIt.JSONUtils.decode({
            syntax: 'mysyntax',
            tokens: [
                {
                    type: MarkupIt.BLOCKS.PARAGRAPH,
                    text: 'Hello World',
                    raw: 'Hello World'
                }
            ]
        });

        it('should decode syntax name', function() {
            content.getSyntax().should.equal('mysyntax');
        });

        it('should decode tokens tree', function() {
            var tokens = content.getTokens();
            tokens.size.should.equal(1);

            var p = tokens.get(0);
            p.getType().should.equal(MarkupIt.BLOCKS.PARAGRAPH);
            p.getText().should.equal('Hello World');
            p.getRaw().should.equal('Hello World');
            p.getTokens().size.should.equal(0);
        });

    });

    describe('encode', function() {
        var json = MarkupIt.JSONUtils.encode(mock.paragraph);

        it('should encode syntax name', function() {
            json.syntax.should.equal('mysyntax');
        });

        it('should encode tokens', function() {
            json.tokens.should.have.lengthOf(1);

            var p = json.tokens[0];
            p.type.should.equal(MarkupIt.BLOCKS.PARAGRAPH);
            p.text.should.equal('Hello World');
            p.tokens.should.be.an.Array().with.lengthOf(2);
        });
    });

});
