'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { User, Users, Crown, Shield, Loader2, RefreshCw, AlertCircle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface TelegramUserData {
  id: string
  telegramId: number
  firstName: string
  lastName?: string
  username?: string
  languageCode?: string
  photoUrl?: string
  isPremium: boolean
}

interface GroupData {
  id: string
  telegramId: string
  title?: string
  type?: string
  username?: string
  role?: string
  joinedAt?: string
}

interface AuthResponse {
  success: boolean
  user?: TelegramUserData
  groups?: GroupData[]
  currentGroup?: GroupData
  sessionId?: string
  error?: string
}

export default function Home() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<AuthResponse | null>(null)

  const authenticate = async () => {
    setLoading(true)
    setError(null)

    try {
      // Ждем небольшое время, чтобы Telegram WebApp SDK загрузился
      await new Promise(resolve => setTimeout(resolve, 100))

      // Проверяем, что мы в Telegram WebApp
      const webApp = (window as any).Telegram?.WebApp

      if (!webApp) {
        // Если НЕ в Telegram - всегда показываем тестовые данные
        // Это позволяет тестировать приложение в браузере
        console.warn('Telegram WebApp не найден. Режим демонстрации с тестовыми данными.')

        // Имитируем успешный ответ для демонстрации
        setData({
          success: true,
          user: {
            id: 'demo-user-id',
            telegramId: 123456789,
            firstName: 'Демонстрационный',
            lastName: 'Пользователь',
            username: 'demo_user',
            languageCode: 'ru',
            isPremium: true,
          },
          groups: [
            {
              id: 'demo-group-1',
              telegramId: '-1001234567890',
              title: 'Демонстрационная группа',
              type: 'supergroup',
              username: 'demo_group',
              role: 'admin',
              joinedAt: new Date().toISOString(),
            }
          ],
          currentGroup: {
            id: 'demo-group-1',
            telegramId: '-1001234567890',
            title: 'Демонстрационная группа',
            type: 'supergroup',
            username: 'demo_group',
          },
          sessionId: 'demo-session-id',
        })

        setLoading(false)
        return
      }

      // Инициализируем Telegram WebApp
      webApp.ready()
      webApp.expand()

      // Получаем initData
      const initData = webApp.initData

      if (!initData) {
        setError('Не удалось получить данные от Telegram')
        setLoading(false)
        return
      }

      // Отправляем данные на наш API
      const response = await fetch('/api/telegram/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ initData }),
      })

      const result: AuthResponse = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Ошибка авторизации')
      }

      setData(result)
      toast({
        title: 'Успешно!',
        description: 'Данные загружены',
      })

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка'
      setError(errorMessage)
      toast({
        title: 'Ошибка',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    authenticate()
  }, [])

  const getRoleIcon = (role?: string) => {
    if (role === 'creator' || role === 'admin') return <Crown className="h-4 w-4" />
    if (role === 'moderator') return <Shield className="h-4 w-4" />
    return null
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.[0] || ''
    const last = lastName?.[0] || ''
    return (first + last).toUpperCase() || 'U'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground text-center">Загрузка данных...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle>Ошибка</CardTitle>
            </div>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={authenticate} className="w-full" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Попробовать снова
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data?.user) {
    return null
  }

  const { user, groups, currentGroup } = data

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Карточка пользователя */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.photoUrl} alt={user.firstName} />
                <AvatarFallback className="text-lg font-semibold">
                  {getInitials(user.firstName, user.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  {user.firstName} {user.lastName}
                  {user.isPremium && (
                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      Premium
                    </Badge>
                  )}
                </CardTitle>
                {user.username && (
                  <CardDescription>@{user.username}</CardDescription>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">ID пользователя</p>
                <p className="font-mono font-semibold">{user.telegramId}</p>
              </div>
              {user.languageCode && (
                <div>
                  <p className="text-muted-foreground">Язык</p>
                  <p className="font-semibold capitalize">{user.languageCode}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Текущая группа */}
        {currentGroup && (
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                Текущая группа
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Название</p>
                <p className="font-semibold">{currentGroup.title || 'Без названия'}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">ID группы</p>
                  <p className="font-mono font-semibold">{currentGroup.telegramId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Тип</p>
                  <p className="font-semibold capitalize">{currentGroup.type || 'group'}</p>
                </div>
              </div>
              {currentGroup.username && (
                <div>
                  <p className="text-sm text-muted-foreground">Username</p>
                  <p className="font-semibold">@{currentGroup.username}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Все группы пользователя */}
        {groups && groups.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                Все группы ({groups.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {groups.map((group, index) => (
                <div key={group.id}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{group.title || 'Без названия'}</p>
                        {getRoleIcon(group.role)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <span className="font-mono">{group.telegramId}</span>
                        {group.username && <span>@{group.username}</span>}
                      </div>
                      {group.role && group.role !== 'member' && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          {group.role === 'creator' && 'Создатель'}
                          {group.role === 'admin' && 'Администратор'}
                          {group.role === 'moderator' && 'Модератор'}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {index < groups.length - 1 && <Separator className="mt-3" />}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Информация для разработчика */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-sm">Информация для разработчика</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-1 font-mono">
              <p>Session ID: {data.sessionId}</p>
              <p>Database ID: {user.id}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}