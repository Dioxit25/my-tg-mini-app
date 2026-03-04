import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

async function generateMiniAppImage() {
  console.log('🎨 Генерирую современное изображение для FreeTime V2 Mini App...');

  try {
    const zai = await ZAI.create();

    const prompt = 'Modern minimalist app banner for "FreeTime V2", sleek design with abstract flowing time patterns, gradient colors from deep blue to vibrant purple, clean typography space, professional tech aesthetic, 16:9 aspect ratio, high quality, detailed, modern UI design style';

    console.log('📝 Prompt:', prompt);

    const response = await zai.images.generations.create({
      prompt: prompt,
      size: '1344x768' // Поддерживаемый размер, близкий к 16:9
    });

    if (!response.data || !response.data[0] || !response.data[0].base64) {
      throw new Error('Invalid response from image generation API');
    }

    const imageBase64 = response.data[0].base64;
    const buffer = Buffer.from(imageBase64, 'base64');

    const outputPath = path.join(process.cwd(), 'miniapp-banner-1344x768.png');
    fs.writeFileSync(outputPath, buffer);

    console.log('✅ Изображение успешно создано!');
    console.log('📁 Путь:', outputPath);
    console.log('📏 Размер: 1344x768 пикселей (соотношение 1.75:1, близко к 16:9)');
    console.log('');
    console.log('💡 Подсказки:');
    console.log('   - BotFather требует размер 640x360');
    console.log('   - Это изображение можно обрезать до 640x360');
    console.log('   - Откройте изображение и обрежьте по центру до нужного размера');
    console.log('');
    console.log('📤 Как отправить в BotFather:');
    console.log('   1. Откройте файл: miniapp-banner-1344x768.png');
    console.log('   2. Используйте любой редактор фото (Paint, Photoshop и т.д.)');
    console.log('   3. Обрежьте/масштабируйте до 640x360');
    console.log('   4. Сохраните и отправьте в @BotFather');

    return outputPath;
  } catch (error) {
    console.error('❌ Ошибка при генерации изображения:', error.message);
    throw error;
  }
}

generateMiniAppImage();
