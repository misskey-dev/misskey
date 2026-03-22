export class NoctownTables1734012000000 {
    name = 'NoctownTables1734012000000'

    async up(queryRunner) {
        // 1. noctown_world (no dependencies)
        await queryRunner.query(`
            CREATE TABLE "noctown_world" (
                "id" varchar(32) PRIMARY KEY NOT NULL,
                "seed" bigint NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
            )
        `);

        // 2. noctown_item (references user)
        await queryRunner.query(`
            CREATE TABLE "noctown_item" (
                "id" varchar(32) PRIMARY KEY NOT NULL,
                "name" varchar(128) NOT NULL,
                "flavorText" text,
                "imageUrl" varchar(512),
                "fullImageUrl" varchar(512),
                "rarity" smallint NOT NULL DEFAULT 0,
                "itemType" varchar(32) NOT NULL DEFAULT 'normal',
                "isUnique" boolean NOT NULL DEFAULT false,
                "isPlayerCreated" boolean NOT NULL DEFAULT false,
                "creatorId" varchar(32),
                "shopPrice" integer,
                "shopSellPrice" integer,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "FK_noctown_item_creator" FOREIGN KEY ("creatorId") REFERENCES "user"("id") ON DELETE SET NULL
            )
        `);

        // 3. noctown_player (references user)
        await queryRunner.query(`
            CREATE TABLE "noctown_player" (
                "id" varchar(32) PRIMARY KEY NOT NULL,
                "userId" varchar(32) NOT NULL,
                "positionX" real NOT NULL DEFAULT 0,
                "positionY" real NOT NULL DEFAULT 0,
                "positionZ" real NOT NULL DEFAULT 0,
                "rotation" real NOT NULL DEFAULT 0,
                "equippedSkinId" varchar(32),
                "equippedAgentId" varchar(32),
                "isOnline" boolean NOT NULL DEFAULT false,
                "lastActiveAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "FK_noctown_player_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
            )
        `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_noctown_player_userId" ON "noctown_player" ("userId")`);

        // 4. noctown_wallet (references noctown_player)
        await queryRunner.query(`
            CREATE TABLE "noctown_wallet" (
                "id" varchar(32) PRIMARY KEY NOT NULL,
                "playerId" varchar(32) NOT NULL,
                "balance" bigint NOT NULL DEFAULT 0,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "FK_noctown_wallet_player" FOREIGN KEY ("playerId") REFERENCES "noctown_player"("id") ON DELETE CASCADE
            )
        `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_noctown_wallet_playerId" ON "noctown_wallet" ("playerId")`);

        // 5. noctown_npc (references noctown_player)
        await queryRunner.query(`
            CREATE TABLE "noctown_npc" (
                "id" varchar(32) PRIMARY KEY NOT NULL,
                "playerId" varchar(32) NOT NULL,
                "positionX" real NOT NULL,
                "positionY" real NOT NULL,
                "positionZ" real NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "FK_noctown_npc_player" FOREIGN KEY ("playerId") REFERENCES "noctown_player"("id") ON DELETE CASCADE
            )
        `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_noctown_npc_playerId" ON "noctown_npc" ("playerId")`);

        // 6. noctown_player_score
        await queryRunner.query(`
            CREATE TABLE "noctown_player_score" (
                "id" varchar(32) PRIMARY KEY NOT NULL,
                "playerId" varchar(32) NOT NULL,
                "balanceScore" integer NOT NULL DEFAULT 0,
                "itemScore" integer NOT NULL DEFAULT 0,
                "questScore" integer NOT NULL DEFAULT 0,
                "speedScore" integer NOT NULL DEFAULT 0,
                "totalScore" integer NOT NULL DEFAULT 0,
                "calculatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "FK_noctown_player_score_player" FOREIGN KEY ("playerId") REFERENCES "noctown_player"("id") ON DELETE CASCADE
            )
        `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_noctown_player_score_playerId" ON "noctown_player_score" ("playerId")`);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_player_score_totalScore" ON "noctown_player_score" ("totalScore") WHERE "totalScore" > 0`);

        // 7. noctown_player_statistics
        await queryRunner.query(`
            CREATE TABLE "noctown_player_statistics" (
                "id" varchar(32) PRIMARY KEY NOT NULL,
                "playerId" varchar(32) NOT NULL,
                "questsCompleted" integer NOT NULL DEFAULT 0,
                "totalQuestTimeSeconds" bigint NOT NULL DEFAULT 0,
                "totalPlayTimeSeconds" bigint NOT NULL DEFAULT 0,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "FK_noctown_player_statistics_player" FOREIGN KEY ("playerId") REFERENCES "noctown_player"("id") ON DELETE CASCADE
            )
        `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_noctown_player_statistics_playerId" ON "noctown_player_statistics" ("playerId")`);

        // 8. noctown_player_item
        await queryRunner.query(`
            CREATE TABLE "noctown_player_item" (
                "id" varchar(32) PRIMARY KEY NOT NULL,
                "playerId" varchar(32) NOT NULL,
                "itemId" varchar(32) NOT NULL,
                "quantity" integer NOT NULL DEFAULT 1,
                "acquiredAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "FK_noctown_player_item_player" FOREIGN KEY ("playerId") REFERENCES "noctown_player"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_noctown_player_item_item" FOREIGN KEY ("itemId") REFERENCES "noctown_item"("id") ON DELETE CASCADE
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_player_item_playerId" ON "noctown_player_item" ("playerId")`);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_player_item_playerId_itemId" ON "noctown_player_item" ("playerId", "itemId")`);

        // 9. noctown_placed_item
        await queryRunner.query(`
            CREATE TABLE "noctown_placed_item" (
                "id" varchar(32) PRIMARY KEY NOT NULL,
                "playerId" varchar(32) NOT NULL,
                "itemId" varchar(32) NOT NULL,
                "positionX" real NOT NULL,
                "positionY" real NOT NULL,
                "positionZ" real NOT NULL,
                "rotation" real NOT NULL DEFAULT 0,
                "placedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "FK_noctown_placed_item_player" FOREIGN KEY ("playerId") REFERENCES "noctown_player"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_noctown_placed_item_item" FOREIGN KEY ("itemId") REFERENCES "noctown_item"("id") ON DELETE CASCADE
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_placed_item_playerId" ON "noctown_placed_item" ("playerId")`);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_placed_item_position" ON "noctown_placed_item" ("positionX", "positionZ")`);

        // 10. noctown_dropped_item
        await queryRunner.query(`
            CREATE TABLE "noctown_dropped_item" (
                "id" varchar(32) PRIMARY KEY NOT NULL,
                "itemId" varchar(32) NOT NULL,
                "positionX" real NOT NULL,
                "positionY" real NOT NULL,
                "positionZ" real NOT NULL,
                "droppedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "FK_noctown_dropped_item_item" FOREIGN KEY ("itemId") REFERENCES "noctown_item"("id") ON DELETE CASCADE
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_dropped_item_position" ON "noctown_dropped_item" ("positionX", "positionZ")`);

        // 11. noctown_world_chunk
        await queryRunner.query(`
            CREATE TABLE "noctown_world_chunk" (
                "id" varchar(32) PRIMARY KEY NOT NULL,
                "worldId" varchar(32) NOT NULL,
                "chunkX" integer NOT NULL,
                "chunkZ" integer NOT NULL,
                "terrainData" jsonb NOT NULL,
                "biome" varchar(64) NOT NULL DEFAULT 'plains',
                "generatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "FK_noctown_world_chunk_world" FOREIGN KEY ("worldId") REFERENCES "noctown_world"("id") ON DELETE CASCADE,
                CONSTRAINT "UQ_noctown_world_chunk_world_chunk" UNIQUE ("worldId", "chunkX", "chunkZ")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_world_chunk_worldId" ON "noctown_world_chunk" ("worldId")`);

        // 12. noctown_quest (references noctown_player, noctown_item, noctown_npc)
        await queryRunner.query(`
            CREATE TABLE "noctown_quest" (
                "id" varchar(32) PRIMARY KEY NOT NULL,
                "playerId" varchar(32) NOT NULL,
                "questType" varchar(32) NOT NULL,
                "difficulty" smallint NOT NULL DEFAULT 1,
                "status" varchar(16) NOT NULL DEFAULT 'active',
                "targetItemId" varchar(32),
                "targetCondition" jsonb,
                "sourceNpcId" varchar(32) NOT NULL,
                "destinationNpcId" varchar(32),
                "rewardCoins" integer NOT NULL,
                "rewardItemId" varchar(32),
                "spawnedItemX" real,
                "spawnedItemZ" real,
                "startedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "completedAt" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "FK_noctown_quest_player" FOREIGN KEY ("playerId") REFERENCES "noctown_player"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_noctown_quest_targetItem" FOREIGN KEY ("targetItemId") REFERENCES "noctown_item"("id") ON DELETE SET NULL,
                CONSTRAINT "FK_noctown_quest_sourceNpc" FOREIGN KEY ("sourceNpcId") REFERENCES "noctown_npc"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_noctown_quest_destinationNpc" FOREIGN KEY ("destinationNpcId") REFERENCES "noctown_npc"("id") ON DELETE SET NULL,
                CONSTRAINT "FK_noctown_quest_rewardItem" FOREIGN KEY ("rewardItemId") REFERENCES "noctown_item"("id") ON DELETE SET NULL
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_quest_playerId" ON "noctown_quest" ("playerId")`);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_quest_playerId_status" ON "noctown_quest" ("playerId", "status")`);

        // 13. noctown_farm_plot
        await queryRunner.query(`
            CREATE TABLE "noctown_farm_plot" (
                "id" varchar(32) PRIMARY KEY NOT NULL,
                "playerId" varchar(32) NOT NULL,
                "positionX" real NOT NULL,
                "positionY" real NOT NULL,
                "positionZ" real NOT NULL,
                "size" smallint NOT NULL DEFAULT 1,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "FK_noctown_farm_plot_player" FOREIGN KEY ("playerId") REFERENCES "noctown_player"("id") ON DELETE CASCADE
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_farm_plot_playerId" ON "noctown_farm_plot" ("playerId")`);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_farm_plot_position" ON "noctown_farm_plot" ("positionX", "positionZ")`);

        // 14. noctown_crop
        await queryRunner.query(`
            CREATE TABLE "noctown_crop" (
                "id" varchar(32) PRIMARY KEY NOT NULL,
                "plotId" varchar(32) NOT NULL,
                "seedItemId" varchar(32) NOT NULL,
                "stage" varchar(32) NOT NULL DEFAULT 'seed',
                "waterLevel" smallint NOT NULL DEFAULT 0,
                "growthProgress" smallint NOT NULL DEFAULT 0,
                "plantedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "lastWateredAt" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "FK_noctown_crop_plot" FOREIGN KEY ("plotId") REFERENCES "noctown_farm_plot"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_noctown_crop_seedItem" FOREIGN KEY ("seedItemId") REFERENCES "noctown_item"("id") ON DELETE CASCADE
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_crop_plotId" ON "noctown_crop" ("plotId")`);

        // 15. noctown_chicken
        await queryRunner.query(`
            CREATE TABLE "noctown_chicken" (
                "id" varchar(32) PRIMARY KEY NOT NULL,
                "playerId" varchar(32) NOT NULL,
                "name" varchar(64),
                "positionX" real NOT NULL,
                "positionY" real NOT NULL,
                "positionZ" real NOT NULL,
                "hunger" smallint NOT NULL DEFAULT 100,
                "happiness" smallint NOT NULL DEFAULT 100,
                "eggsReady" smallint NOT NULL DEFAULT 0,
                "lastFedAt" TIMESTAMP WITH TIME ZONE,
                "lastEggCollectedAt" TIMESTAMP WITH TIME ZONE,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "FK_noctown_chicken_player" FOREIGN KEY ("playerId") REFERENCES "noctown_player"("id") ON DELETE CASCADE
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_chicken_playerId" ON "noctown_chicken" ("playerId")`);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_chicken_position" ON "noctown_chicken" ("positionX", "positionZ")`);

        // 16. noctown_cow
        await queryRunner.query(`
            CREATE TABLE "noctown_cow" (
                "id" varchar(32) PRIMARY KEY NOT NULL,
                "playerId" varchar(32) NOT NULL,
                "name" varchar(64),
                "positionX" real NOT NULL,
                "positionY" real NOT NULL,
                "positionZ" real NOT NULL,
                "hunger" smallint NOT NULL DEFAULT 100,
                "happiness" smallint NOT NULL DEFAULT 100,
                "milkReady" smallint NOT NULL DEFAULT 0,
                "lastFedAt" TIMESTAMP WITH TIME ZONE,
                "lastMilkCollectedAt" TIMESTAMP WITH TIME ZONE,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "FK_noctown_cow_player" FOREIGN KEY ("playerId") REFERENCES "noctown_player"("id") ON DELETE CASCADE
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_cow_playerId" ON "noctown_cow" ("playerId")`);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_cow_position" ON "noctown_cow" ("positionX", "positionZ")`);

        // 17. noctown_recipe
        await queryRunner.query(`
            CREATE TABLE "noctown_recipe" (
                "id" varchar(32) PRIMARY KEY NOT NULL,
                "name" varchar(128) NOT NULL,
                "description" text,
                "resultItemId" varchar(32) NOT NULL,
                "resultQuantity" smallint NOT NULL DEFAULT 1,
                "requiredLevel" smallint NOT NULL DEFAULT 0,
                "isLocked" boolean NOT NULL DEFAULT false,
                "category" varchar(32) NOT NULL DEFAULT 'normal',
                "craftingTime" integer NOT NULL DEFAULT 0,
                "craftingCost" integer NOT NULL DEFAULT 0,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "FK_noctown_recipe_resultItem" FOREIGN KEY ("resultItemId") REFERENCES "noctown_item"("id") ON DELETE CASCADE
            )
        `);

        // 18. noctown_recipe_ingredient
        await queryRunner.query(`
            CREATE TABLE "noctown_recipe_ingredient" (
                "id" varchar(32) PRIMARY KEY NOT NULL,
                "recipeId" varchar(32) NOT NULL,
                "itemId" varchar(32) NOT NULL,
                "quantity" smallint NOT NULL DEFAULT 1,
                "isConsumed" boolean NOT NULL DEFAULT true,
                CONSTRAINT "FK_noctown_recipe_ingredient_recipe" FOREIGN KEY ("recipeId") REFERENCES "noctown_recipe"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_noctown_recipe_ingredient_item" FOREIGN KEY ("itemId") REFERENCES "noctown_item"("id") ON DELETE CASCADE,
                CONSTRAINT "UQ_noctown_recipe_ingredient_recipe_item" UNIQUE ("recipeId", "itemId")
            )
        `);

        // 19. noctown_trade
        await queryRunner.query(`
            CREATE TABLE "noctown_trade" (
                "id" varchar(32) PRIMARY KEY NOT NULL,
                "initiatorId" varchar(32) NOT NULL,
                "targetId" varchar(32) NOT NULL,
                "status" varchar(32) NOT NULL DEFAULT 'pending',
                "initiatorCurrency" integer NOT NULL DEFAULT 0,
                "targetCurrency" integer NOT NULL DEFAULT 0,
                "initiatorConfirmed" boolean NOT NULL DEFAULT false,
                "targetConfirmed" boolean NOT NULL DEFAULT false,
                "message" text,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "completedAt" TIMESTAMP WITH TIME ZONE,
                "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
                CONSTRAINT "FK_noctown_trade_initiator" FOREIGN KEY ("initiatorId") REFERENCES "noctown_player"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_noctown_trade_target" FOREIGN KEY ("targetId") REFERENCES "noctown_player"("id") ON DELETE CASCADE
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_trade_initiatorId_status" ON "noctown_trade" ("initiatorId", "status")`);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_trade_targetId_status" ON "noctown_trade" ("targetId", "status")`);

        // 20. noctown_trade_item
        await queryRunner.query(`
            CREATE TABLE "noctown_trade_item" (
                "id" varchar(32) PRIMARY KEY NOT NULL,
                "tradeId" varchar(32) NOT NULL,
                "itemId" varchar(32) NOT NULL,
                "quantity" smallint NOT NULL DEFAULT 1,
                "isFromInitiator" boolean NOT NULL,
                CONSTRAINT "FK_noctown_trade_item_trade" FOREIGN KEY ("tradeId") REFERENCES "noctown_trade"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_noctown_trade_item_item" FOREIGN KEY ("itemId") REFERENCES "noctown_item"("id") ON DELETE CASCADE
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_trade_item_tradeId" ON "noctown_trade_item" ("tradeId")`);

        // 21. noctown_interior_map
        await queryRunner.query(`
            CREATE TABLE "noctown_interior_map" (
                "id" varchar(32) PRIMARY KEY NOT NULL,
                "interiorId" varchar(128) NOT NULL,
                "type" varchar(32) NOT NULL,
                "name" varchar(128) NOT NULL,
                "width" smallint NOT NULL,
                "depth" smallint NOT NULL,
                "tiles" jsonb NOT NULL,
                "npcs" jsonb NOT NULL DEFAULT '[]',
                "furniture" jsonb NOT NULL DEFAULT '[]',
                "entryX" smallint NOT NULL DEFAULT 0,
                "entryZ" smallint NOT NULL DEFAULT 0,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
            )
        `);

        // 22. noctown_shop_inventory
        await queryRunner.query(`
            CREATE TABLE "noctown_shop_inventory" (
                "id" varchar(32) PRIMARY KEY NOT NULL,
                "interiorMapId" varchar(32) NOT NULL,
                "itemId" varchar(32) NOT NULL,
                "buyPrice" integer NOT NULL,
                "sellPrice" integer,
                "stock" integer,
                "maxStock" integer,
                "lastRestockAt" TIMESTAMP WITH TIME ZONE,
                "restockIntervalHours" integer,
                "isAvailable" boolean NOT NULL DEFAULT true,
                "displayOrder" smallint NOT NULL DEFAULT 0,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "FK_noctown_shop_inventory_interiorMap" FOREIGN KEY ("interiorMapId") REFERENCES "noctown_interior_map"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_noctown_shop_inventory_item" FOREIGN KEY ("itemId") REFERENCES "noctown_item"("id") ON DELETE CASCADE
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_shop_inventory_interiorMapId" ON "noctown_shop_inventory" ("interiorMapId")`);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_shop_inventory_itemId" ON "noctown_shop_inventory" ("itemId")`);

        // 23. noctown_treasure_chest
        await queryRunner.query(`
            CREATE TABLE "noctown_treasure_chest" (
                "id" varchar(32) PRIMARY KEY NOT NULL,
                "chunkX" integer NOT NULL,
                "chunkZ" integer NOT NULL,
                "localX" real NOT NULL,
                "localZ" real NOT NULL,
                "positionY" real NOT NULL,
                "rarity" varchar(32) NOT NULL DEFAULT 'common',
                "isOpened" boolean NOT NULL DEFAULT false,
                "openedByPlayerId" varchar(32),
                "openedAt" TIMESTAMP WITH TIME ZONE,
                "respawnAt" TIMESTAMP WITH TIME ZONE,
                "containedItemId" varchar(32),
                "containedQuantity" integer NOT NULL DEFAULT 1,
                "bonusCoins" integer NOT NULL DEFAULT 0,
                "interiorId" varchar(128),
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "FK_noctown_treasure_chest_containedItem" FOREIGN KEY ("containedItemId") REFERENCES "noctown_item"("id") ON DELETE SET NULL
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_treasure_chest_chunkX" ON "noctown_treasure_chest" ("chunkX")`);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_treasure_chest_chunkZ" ON "noctown_treasure_chest" ("chunkZ")`);

        // 24. noctown_house
        await queryRunner.query(`
            CREATE TABLE "noctown_house" (
                "id" varchar(32) PRIMARY KEY NOT NULL,
                "ownerId" varchar(32) NOT NULL,
                "name" varchar(64),
                "positionX" real NOT NULL,
                "positionY" real NOT NULL,
                "positionZ" real NOT NULL,
                "rotation" real NOT NULL DEFAULT 0,
                "houseType" smallint NOT NULL DEFAULT 1,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "FK_noctown_house_owner" FOREIGN KEY ("ownerId") REFERENCES "noctown_player"("id") ON DELETE CASCADE
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_house_ownerId" ON "noctown_house" ("ownerId")`);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_house_position" ON "noctown_house" ("positionX", "positionZ")`);

        // 25. noctown_house_wall_item
        await queryRunner.query(`
            CREATE TABLE "noctown_house_wall_item" (
                "id" varchar(32) PRIMARY KEY NOT NULL,
                "houseId" varchar(32) NOT NULL,
                "type" varchar(16) NOT NULL,
                "wallPosition" varchar(16) NOT NULL,
                "positionIndex" smallint NOT NULL DEFAULT 0,
                "baseItemId" varchar(32),
                "attachedPlayerItemId" varchar(32),
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "FK_noctown_house_wall_item_house" FOREIGN KEY ("houseId") REFERENCES "noctown_house"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_noctown_house_wall_item_attachedPlayerItem" FOREIGN KEY ("attachedPlayerItemId") REFERENCES "noctown_player_item"("id") ON DELETE SET NULL
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_house_wall_item_houseId" ON "noctown_house_wall_item" ("houseId")`);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_house_wall_item_houseId_wallPosition" ON "noctown_house_wall_item" ("houseId", "wallPosition")`);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_house_wall_item_baseItemId" ON "noctown_house_wall_item" ("baseItemId")`);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_house_wall_item_attachedPlayerItemId" ON "noctown_house_wall_item" ("attachedPlayerItemId")`);

        // 26. noctown_house_furniture
        await queryRunner.query(`
            CREATE TABLE "noctown_house_furniture" (
                "id" varchar(32) PRIMARY KEY NOT NULL,
                "houseId" varchar(32) NOT NULL,
                "itemId" varchar(32) NOT NULL,
                "positionX" real NOT NULL,
                "positionZ" real NOT NULL,
                "rotation" real NOT NULL DEFAULT 0,
                "placedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "FK_noctown_house_furniture_house" FOREIGN KEY ("houseId") REFERENCES "noctown_house"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_noctown_house_furniture_item" FOREIGN KEY ("itemId") REFERENCES "noctown_item"("id") ON DELETE CASCADE
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_house_furniture_houseId" ON "noctown_house_furniture" ("houseId")`);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_house_furniture_itemId" ON "noctown_house_furniture" ("itemId")`);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_house_furniture_position" ON "noctown_house_furniture" ("houseId", "positionX", "positionZ")`);

        // 27. noctown_bulletin_board
        await queryRunner.query(`
            CREATE TABLE "noctown_bulletin_board" (
                "id" varchar(32) PRIMARY KEY NOT NULL,
                "worldId" varchar(32) NOT NULL,
                "positionX" real NOT NULL,
                "positionZ" real NOT NULL,
                "name" varchar(128),
                "boardType" smallint NOT NULL DEFAULT 0,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "FK_noctown_bulletin_board_world" FOREIGN KEY ("worldId") REFERENCES "noctown_world"("id") ON DELETE CASCADE
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_bulletin_board_worldId_position" ON "noctown_bulletin_board" ("worldId", "positionX", "positionZ")`);

        // 28. noctown_bulletin_post
        await queryRunner.query(`
            CREATE TABLE "noctown_bulletin_post" (
                "id" varchar(32) PRIMARY KEY NOT NULL,
                "boardId" varchar(32) NOT NULL,
                "playerId" varchar(32) NOT NULL,
                "content" text NOT NULL,
                "attachedItemId" varchar(32),
                "likeCount" integer NOT NULL DEFAULT 0,
                "isPinned" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "expiresAt" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "FK_noctown_bulletin_post_board" FOREIGN KEY ("boardId") REFERENCES "noctown_bulletin_board"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_noctown_bulletin_post_player" FOREIGN KEY ("playerId") REFERENCES "noctown_player"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_noctown_bulletin_post_attachedItem" FOREIGN KEY ("attachedItemId") REFERENCES "noctown_item"("id") ON DELETE SET NULL
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_bulletin_post_boardId_createdAt" ON "noctown_bulletin_post" ("boardId", "createdAt")`);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_bulletin_post_playerId" ON "noctown_bulletin_post" ("playerId")`);

        // 29. noctown_bulletin_like
        await queryRunner.query(`
            CREATE TABLE "noctown_bulletin_like" (
                "id" varchar(32) PRIMARY KEY NOT NULL,
                "postId" varchar(32) NOT NULL,
                "playerId" varchar(32) NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "FK_noctown_bulletin_like_post" FOREIGN KEY ("postId") REFERENCES "noctown_bulletin_post"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_noctown_bulletin_like_player" FOREIGN KEY ("playerId") REFERENCES "noctown_player"("id") ON DELETE CASCADE,
                CONSTRAINT "UQ_noctown_bulletin_like_post_player" UNIQUE ("postId", "playerId")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_bulletin_like_postId" ON "noctown_bulletin_like" ("postId")`);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_bulletin_like_playerId" ON "noctown_bulletin_like" ("playerId")`);

        // 30. noctown_agent
        await queryRunner.query(`
            CREATE TABLE "noctown_agent" (
                "id" varchar(32) PRIMARY KEY NOT NULL,
                "playerId" varchar(32) NOT NULL,
                "itemId" varchar(32) NOT NULL,
                "nickname" varchar(64),
                "fullness" smallint NOT NULL DEFAULT 100,
                "happiness" smallint NOT NULL DEFAULT 100,
                "level" integer NOT NULL DEFAULT 1,
                "experience" integer NOT NULL DEFAULT 0,
                "isEquipped" boolean NOT NULL DEFAULT false,
                "lastFedAt" TIMESTAMP WITH TIME ZONE,
                "lastHintAt" TIMESTAMP WITH TIME ZONE,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "FK_noctown_agent_player" FOREIGN KEY ("playerId") REFERENCES "noctown_player"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_noctown_agent_item" FOREIGN KEY ("itemId") REFERENCES "noctown_item"("id") ON DELETE CASCADE
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_agent_playerId" ON "noctown_agent" ("playerId")`);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_agent_itemId" ON "noctown_agent" ("itemId")`);

        // 31. noctown_gacha
        await queryRunner.query(`
            CREATE TABLE "noctown_gacha" (
                "id" varchar(32) PRIMARY KEY NOT NULL,
                "name" varchar(128) NOT NULL,
                "description" text,
                "costPerPull" integer NOT NULL DEFAULT 100,
                "isActive" boolean NOT NULL DEFAULT true,
                "positionX" real,
                "positionZ" real,
                "startDate" TIMESTAMP WITH TIME ZONE,
                "endDate" TIMESTAMP WITH TIME ZONE,
                "maxPullsPerPlayer" integer,
                "gachaType" varchar(32) NOT NULL DEFAULT 'standard',
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_gacha_isActive" ON "noctown_gacha" ("isActive")`);

        // 32. noctown_gacha_item
        await queryRunner.query(`
            CREATE TABLE "noctown_gacha_item" (
                "id" varchar(32) PRIMARY KEY NOT NULL,
                "gachaId" varchar(32) NOT NULL,
                "itemId" varchar(32) NOT NULL,
                "weight" integer NOT NULL DEFAULT 100,
                "rarityTier" smallint NOT NULL DEFAULT 0,
                "isUnique" boolean NOT NULL DEFAULT false,
                "isUniqueObtained" boolean NOT NULL DEFAULT false,
                "maxQuantity" integer,
                "currentQuantity" integer NOT NULL DEFAULT 0,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "FK_noctown_gacha_item_gacha" FOREIGN KEY ("gachaId") REFERENCES "noctown_gacha"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_noctown_gacha_item_item" FOREIGN KEY ("itemId") REFERENCES "noctown_item"("id") ON DELETE CASCADE
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_gacha_item_gachaId" ON "noctown_gacha_item" ("gachaId")`);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_gacha_item_itemId" ON "noctown_gacha_item" ("itemId")`);

        // 33. noctown_gacha_pull
        await queryRunner.query(`
            CREATE TABLE "noctown_gacha_pull" (
                "id" varchar(32) PRIMARY KEY NOT NULL,
                "gachaId" varchar(32) NOT NULL,
                "playerId" varchar(32) NOT NULL,
                "itemId" varchar(32) NOT NULL,
                "rarityTier" smallint NOT NULL,
                "wasUnique" boolean NOT NULL DEFAULT false,
                "pulledAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "FK_noctown_gacha_pull_gacha" FOREIGN KEY ("gachaId") REFERENCES "noctown_gacha"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_noctown_gacha_pull_player" FOREIGN KEY ("playerId") REFERENCES "noctown_player"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_noctown_gacha_pull_item" FOREIGN KEY ("itemId") REFERENCES "noctown_item"("id") ON DELETE CASCADE
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_gacha_pull_gachaId_playerId" ON "noctown_gacha_pull" ("gachaId", "playerId")`);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_gacha_pull_playerId" ON "noctown_gacha_pull" ("playerId")`);

        // 34. noctown_event
        await queryRunner.query(`
            CREATE TABLE "noctown_event" (
                "id" varchar(32) PRIMARY KEY NOT NULL,
                "name" varchar(128) NOT NULL,
                "description" text,
                "eventType" varchar(32) NOT NULL DEFAULT 'seasonal',
                "bannerUrl" varchar(512),
                "startDate" TIMESTAMP WITH TIME ZONE NOT NULL,
                "endDate" TIMESTAMP WITH TIME ZONE NOT NULL,
                "isActive" boolean NOT NULL DEFAULT true,
                "requiredPoints" integer NOT NULL DEFAULT 0,
                "config" jsonb,
                "milestones" jsonb,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_event_startDate" ON "noctown_event" ("startDate")`);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_event_endDate" ON "noctown_event" ("endDate")`);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_event_isActive" ON "noctown_event" ("isActive")`);

        // 35. noctown_event_reward
        await queryRunner.query(`
            CREATE TABLE "noctown_event_reward" (
                "id" varchar(32) PRIMARY KEY NOT NULL,
                "eventId" varchar(32) NOT NULL,
                "name" varchar(128) NOT NULL,
                "description" text,
                "requiredPoints" integer NOT NULL DEFAULT 0,
                "rewardType" varchar(32) NOT NULL DEFAULT 'item',
                "itemId" varchar(32),
                "itemQuantity" integer NOT NULL DEFAULT 1,
                "coinAmount" integer,
                "titleOrBadgeId" varchar(64),
                "displayOrder" smallint NOT NULL DEFAULT 0,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "FK_noctown_event_reward_event" FOREIGN KEY ("eventId") REFERENCES "noctown_event"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_noctown_event_reward_item" FOREIGN KEY ("itemId") REFERENCES "noctown_item"("id") ON DELETE SET NULL
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_event_reward_eventId" ON "noctown_event_reward" ("eventId")`);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_event_reward_requiredPoints" ON "noctown_event_reward" ("requiredPoints")`);

        // 36. noctown_event_participation
        await queryRunner.query(`
            CREATE TABLE "noctown_event_participation" (
                "id" varchar(32) PRIMARY KEY NOT NULL,
                "eventId" varchar(32) NOT NULL,
                "playerId" varchar(32) NOT NULL,
                "points" integer NOT NULL DEFAULT 0,
                "claimedRewards" jsonb NOT NULL DEFAULT '[]',
                "completedMilestones" jsonb NOT NULL DEFAULT '[]',
                "progressData" jsonb,
                "joinedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "lastActivityAt" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "FK_noctown_event_participation_event" FOREIGN KEY ("eventId") REFERENCES "noctown_event"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_noctown_event_participation_player" FOREIGN KEY ("playerId") REFERENCES "noctown_player"("id") ON DELETE CASCADE,
                CONSTRAINT "UQ_noctown_event_participation_event_player" UNIQUE ("eventId", "playerId")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_event_participation_eventId" ON "noctown_event_participation" ("eventId")`);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_event_participation_playerId" ON "noctown_event_participation" ("playerId")`);

        // 37. noctown_unique_item
        await queryRunner.query(`
            CREATE TABLE "noctown_unique_item" (
                "id" varchar(32) PRIMARY KEY NOT NULL,
                "itemId" varchar(32) NOT NULL,
                "serialNumber" varchar(128) NOT NULL,
                "currentOwnerId" varchar(32),
                "creatorId" varchar(32),
                "ownershipHistory" jsonb,
                "originMethod" varchar(32) NOT NULL DEFAULT 'system',
                "isObtainable" boolean NOT NULL DEFAULT false,
                "isTradeable" boolean NOT NULL DEFAULT true,
                "firstObtainedAt" TIMESTAMP WITH TIME ZONE,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "FK_noctown_unique_item_item" FOREIGN KEY ("itemId") REFERENCES "noctown_item"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_noctown_unique_item_currentOwner" FOREIGN KEY ("currentOwnerId") REFERENCES "noctown_player"("id") ON DELETE SET NULL
            )
        `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_noctown_unique_item_itemId" ON "noctown_unique_item" ("itemId")`);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_unique_item_currentOwnerId" ON "noctown_unique_item" ("currentOwnerId")`);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_unique_item_createdAt" ON "noctown_unique_item" ("createdAt")`);

        // 38. noctown_ranking_board
        await queryRunner.query(`
            CREATE TABLE "noctown_ranking_board" (
                "id" varchar(32) PRIMARY KEY NOT NULL,
                "category" varchar(32) NOT NULL,
                "playerId" varchar(32) NOT NULL,
                "rank" integer NOT NULL,
                "score" bigint NOT NULL,
                "previousRank" bigint,
                "previousScore" bigint,
                "rankChange" integer NOT NULL DEFAULT 0,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_ranking_board_category_rank" ON "noctown_ranking_board" ("category", "rank")`);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_ranking_board_playerId_category" ON "noctown_ranking_board" ("playerId", "category")`);
        await queryRunner.query(`CREATE INDEX "IDX_noctown_ranking_board_updatedAt" ON "noctown_ranking_board" ("updatedAt")`);
    }

    async down(queryRunner) {
        // Drop tables in reverse order of creation
        await queryRunner.query(`DROP TABLE IF EXISTS "noctown_ranking_board"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "noctown_unique_item"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "noctown_event_participation"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "noctown_event_reward"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "noctown_event"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "noctown_gacha_pull"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "noctown_gacha_item"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "noctown_gacha"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "noctown_agent"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "noctown_bulletin_like"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "noctown_bulletin_post"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "noctown_bulletin_board"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "noctown_house_furniture"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "noctown_house_wall_item"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "noctown_house"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "noctown_treasure_chest"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "noctown_shop_inventory"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "noctown_interior_map"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "noctown_trade_item"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "noctown_trade"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "noctown_recipe_ingredient"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "noctown_recipe"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "noctown_cow"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "noctown_chicken"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "noctown_crop"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "noctown_farm_plot"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "noctown_quest"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "noctown_world_chunk"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "noctown_dropped_item"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "noctown_placed_item"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "noctown_player_item"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "noctown_player_statistics"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "noctown_player_score"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "noctown_npc"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "noctown_wallet"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "noctown_player"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "noctown_item"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "noctown_world"`);
    }
}
