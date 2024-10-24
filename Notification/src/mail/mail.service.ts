import { Injectable } from '@nestjs/common';
import { Mail, MailType, Prisma } from '@prisma/client';

import { PrismaService } from 'src/prisma.service';
import DataMessage from './types/message';
import nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  constructor(private prisma: PrismaService) {

    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'email@example.com',
        pass: '123456',
      },
    });
  }

  async getMailByIdUser(where: Prisma.MailWhereInput): Promise<Mail[] | null> {
    return await this.prisma.mail.findMany({ where });
  }

  async sendMail(content: DataMessage, type: string) {
    const destination = this.getDestination(content.idUser);
    const mailContent = this.makeContent(content.orderNumber, content.orderValue);

    const mailOptions = {
      from: 'your-email@example.com',
      to: destination,
      subject: `Notificação de ${type}`,
      text: mailContent,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('E-mail enviado: %s', info.messageId);

      await this.persistNotification(content, type as MailType);
    } catch (error) {
      console.error('Erro ao enviar e-mail:', error);
    }
  }

  async persistNotification(content: DataMessage, type: MailType) {
    const data = {
      idUser: content.idUser,
      mailDestination: this.getDestination(content.idUser),
      mailContent: this.makeContent(content.orderNumber, content.orderValue),
      mailType: type,
    };

    await this.prisma.mail.create({
      data: { ...data },
    });
  }

  getDestination(idUser: string) {
    switch (idUser) {
      case '10':
        return 'user@teste.com.br';

      default:
        return 'default@teste.com.br';
    }
  }

  makeContent(orderNumber: number, orderValue: number) {
    return `Número do pedido: ${orderNumber.toString()} /n/n
      Valor do pedido: ${orderValue.toString()}
      `;
  }
}
