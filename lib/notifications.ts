import { prisma } from '@/lib/prisma'

interface NewOrderArgs {
  orderId: string
  orderNumber: string
  branchId: string
  branchName?: string | null
  customerName: string
  customerPhone: string
  totalAmount: number
  orderType: 'pickup' | 'delivery'
  itemsCount: number
}

/**
 * Создаёт уведомления для филиала и админов о новом заказе.
 * Не бросает ошибки наверх — логирует и возвращает.
 */
export async function notifyNewOrder(args: NewOrderArgs): Promise<void> {
  try {
    const orderTypeLabel = args.orderType === 'pickup' ? 'Самовывоз' : 'Доставка'
    const baseTitle = `Новый заказ ${args.orderNumber}`
    const baseMessage = `${args.customerName} (${args.customerPhone}) · ${orderTypeLabel} · ${args.itemsCount} ${
      args.itemsCount === 1 ? 'позиция' : args.itemsCount < 5 ? 'позиции' : 'позиций'
    } · ${args.totalAmount} сом`

    await prisma.notification.createMany({
      data: [
        {
          audience: 'branch',
          branchId: args.branchId,
          type: 'new_order',
          title: baseTitle,
          message: baseMessage,
          orderId: args.orderId,
          data: {
            orderNumber: args.orderNumber,
            totalAmount: args.totalAmount,
            orderType: args.orderType,
            itemsCount: args.itemsCount,
          } as any,
        },
        {
          audience: 'admin',
          branchId: args.branchId,
          type: 'new_order',
          title: baseTitle,
          message: `${args.branchName ?? 'Филиал'}: ${baseMessage}`,
          orderId: args.orderId,
          data: {
            orderNumber: args.orderNumber,
            totalAmount: args.totalAmount,
            orderType: args.orderType,
            itemsCount: args.itemsCount,
            branchName: args.branchName ?? null,
          } as any,
        },
      ],
    })
  } catch (error) {
    console.error('[notifications] Failed to create new-order notifications:', error)
  }
}
