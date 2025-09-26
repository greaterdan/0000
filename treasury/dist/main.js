"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: true,
        credentials: true,
    });
    const port = process.env.TREASURY_PORT || 3004;
    await app.listen(port);
    console.log(`Treasury service running on port ${port}`);
    console.log(`Total Supply: 100M AIM`);
    console.log(`Public Sale: 50M AIM (50%)`);
    console.log(`Treasury Reserves: $50M USD`);
}
bootstrap();
//# sourceMappingURL=main.js.map