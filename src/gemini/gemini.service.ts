import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { Injectable } from '@nestjs/common';
import * as fs from 'node:fs/promises';

import { config } from 'dotenv';
config();

const apiKey = `${process.env.GEMINI_API_KEY}`;

@Injectable()
export class GeminiService {
  private genAI;
  private model;
  private fileManager;
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    this.fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);
  }

  async enhanceCV(file) {
    const uploadResponse = await this.fileManager.uploadFile(file.path, {
      mimeType: 'application/pdf',
      displayName: file.name,
    });

    const result = await this.model.generateContent([
      {
        fileData: {
          mimeType: uploadResponse.file.mimeType,
          fileUri: uploadResponse.file.uri,
        },
      },
      'What improvements can I make to this CV to be of interest to potential employers?',
    ]);

    await this.fileManager.deleteFile(uploadResponse.file.name);
    await fs.rm(file.path);
    return result.response.text();
  }
}
