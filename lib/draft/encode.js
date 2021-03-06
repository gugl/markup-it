var Immutable = require('immutable');
var Range = require('range-utils');

var walk = require('../utils/walk');
var genKey = require('../utils/genKey');
var getMutability = require('./getMutability');

var ENTITIES = require('../constants/entities');
var STYLES = require('../constants/styles');
var BLOCKS = require('../constants/blocks');

/*
    Encode an entity from a token

    @param {Token} token
    @return {Object<Entity>}
*/
function encodeTokenToEntity(token) {
    return {
        type: token.getType(),
        mutability: getMutability(token),
        data: token.getData().toJS()
    };
}

/*
    Encode a token into a ContentBlock

    @param {Token} token
    @param {Funciton} registerEntity
    @return {Object<ContentBlock>}
*/
function encodeTokenToBlock(token, registerEntity) {
    var tokenType = token.getType();
    var inlineStyleRanges = [];
    var entityRanges = [];
    var blockTokens = [];

    // Add child block tokens as data.innerContent
    token.getTokens()
        .forEach(function(tok) {
            if (!tok.isBlock()) {
                return;
            }

            blockTokens.push(tok);
        });

    var innerText = walk(token, function(tok, range) {
        if (tok.isEntity()) {
            var entity = encodeTokenToEntity(tok);

            entityRanges.push(
                Range(
                    range.offset,
                    range.length,
                    {
                        entity: entity
                    }
                )
            );

        } else if (tok.isStyle() && tok.getType() !== STYLES.TEXT) {
            inlineStyleRanges.push(
                Range(
                    range.offset,
                    range.length,
                    {
                        style: tok.getType()
                    }
                )
            );
        }
    });

    // Linearize/Merge ranges (draft-js doesn't support multiple entities on the same range)
    entityRanges = Range.merge(entityRanges, function(a, b) {
        if (
            (a.entity.type == ENTITIES.IMAGE || a.entity.type == ENTITIES.LINK) &&
            (b.entity.type == ENTITIES.IMAGE || b.entity.type == ENTITIES.LINK) &&
            (a.entity.type !== b.entity.type)
        ) {
            var img =  ((a.entity.type == ENTITIES.IMAGE)? a : b).entity.data;
            var link =  ((a.entity.type == ENTITIES.LINK)? a : b).entity.data;

            return Range(a.offset, a.length, {
                entity: {
                    type: ENTITIES.LINK_IMAGE,
                    mutability: getMutability(ENTITIES.LINK_IMAGE),
                    data: {
                        src: img.src,
                        href: link.href,
                        imageTitle: img.title,
                        linkTitle: link.title
                    }
                }
            });
        }

        return a;
    });

    // Register all entities
    entityRanges = entityRanges.map(function(range) {
        var entityKey = registerEntity(range.entity);

        return Range(range.offset, range.length, {
            key: entityKey
        });
    });

    // Metadata for this blocks
    var data = token.getData().toJS();

    // Encode inner tokens
    blockTokens = encodeTokensToBlocks(Immutable.List(blockTokens));

    return {
        key: genKey(),
        type: tokenType,
        text: innerText,
        data: data,
        inlineStyleRanges: inlineStyleRanges,
        entityRanges: entityRanges,
        blocks: blockTokens
    };
}


/*
    Encode a list of Token into a RawContentState for draft

    @paran {List<Token>} tokens
    @param {Funciton} registerEntity
    @return {Object<RawContentState>}
*/
function encodeTokensToBlocks(blockTokens, registerEntity) {
    return blockTokens.map(function(token) {
        return encodeTokenToBlock(token, registerEntity);
    }).toJS();
}


/*
    Encode a Content instance into a RawContentState for draft

    @paran {Content} content
    @return {Object<RawContentState>}
*/
function encodeContentToDraft(content) {
    var blockTokens = content.getTokens();
    var entityKey = 0;
    var entityMap = {};

    // Register an entity and returns its key/ID
    function registerEntity(entity) {
        entityKey++;
        entityMap[entityKey] = entity;

        return entityKey;
    }

    return {
        blocks: encodeTokensToBlocks(blockTokens, registerEntity),
        entityMap: entityMap
    };
}



module.exports = encodeContentToDraft;
