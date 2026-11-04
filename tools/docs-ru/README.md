# QlsOS (Quick Light Secure OS)

**QlsOS** (*Quick Light Secure OS*) — небольшое **capability-микроядро**, написанное с нуля: свой загрузчик, ядро, драйверы и шелл, без сторонних библиотек.
Ядро полностью своё (Linux/WSL нужен только как среда сборки). Работает на **x86 (32 бита)** и **ARM (Cortex-A15, QEMU `virt`)**; x86-порт грузится в QEMU
и имеет загрузчик, подготовленный для настоящих ПК (BIOS, USB-флешка). Цель первого релиза — **v1.0.0**.

Цели дизайна: **маленькая** (код ядра меньше 64 KiB к v1.0.0), **безопасная** (задача трогает только то, на что у неё есть handle),
**быстрый запуск программ** и достаточно лёгкая для самых слабых IoT-устройств.

> Краткое описание проекта и статус: [`PROJECT.md`](PROJECT.md) · Контракт архитектуры: [`ARCHITECTURE.md`](ARCHITECTURE.md) · Устройство кода: [`docs/architecture.md`](docs/architecture.md)

## Дизайн вкратце

- **Всё идёт через каналы и handles.** Handle — единственный способ, которым задача ссылается на объект ядра. Задача видит только выданные ей
  handles; права можно только сужать, никогда не расширять; handle можно отозвать или ограничить по времени.
- **Нет PID, сигналов и `fork`/`wait`.** Программа запускается через `spawn`; то, как она завершилась, приходит одним сообщением по каналу результата;
  задачу останавливают или убивают через handle задачи.
- **Система живёт в userspace.** *System Dispatcher* в ring 3 запускает сервисы и выдаёт каналы клиентам; консоль (VGA) и клавиатура — драйверы-задачи в ring 3;
  шелл тоже есть как программа ring 3 (`sh`). Шелл в ядре остаётся как тестовый и запасной. Доступ к устройствам сам по себе capability
  (области памяти, порты ввода-вывода и линии прерываний — как handles).
- **Код 64-bit clean** (`uintptr_t`, `size_t`, типы фиксированной ширины, проверяется `make check64`); 64-битный порт и другие платформы
  появятся после v1.0.0 через HAL.
- **Каждый шаг закрыт тестом** (на хосте под ASan/UBSan и/или в QEMU).

## Что работает сегодня

- **x86:** свой двухстадийный загрузчик (читает карту памяти BIOS, использует LBA или CHS, как позволяет BIOS, **проверяет CRC-32 ядра перед
  прыжком**), защищённый режим, paging, менеджер физической памяти, куча, вытесняющий round-robin планировщик, задачи ring 3 со своими
  page directory, системные вызовы `int 0x80`, клавиатура и мышь PS/2, текстовая консоль VGA с прокруткой, ATA/IDE, RTC, PCI, перезагрузка и выключение через ACPI.
- **Задачи:** загрузчик ELF32, `spawn` из ring 3 (новая задача получает ровно выданные ей handles), канал результата, handle управления задачей
  (stop / resume / kill), лимиты на задачу (кадры памяти, handles), аккуратная обработка сбоев (падение убивает только эту задачу),
  блокирующий `sleep` и блокирующие вызовы каналов (без опроса, без нагрузки на CPU при ожидании).
- **Handles и каналы:** таблица handles на каждую задачу, каналы с ограниченными очередями (сообщения по 64 байта), передача handles в сообщениях
  (те же права или меньше), `revoke` и ограничение handles по времени, точное освобождение каждого объекта (проверено тестами), `caps` — посмотреть, кто чем владеет.
- **Система в userspace:** System Dispatcher с контролируемыми сервисами, сервис консоли (`consoled`) и сервис клавиатуры (`kbdd`) как драйверы ring 3
  с автоматическим возвратом к драйверу ядра, шелл `sh` в ring 3 с командой `run prog [args] [--grant name[:rights]]`.
- **Хранилище:** слой VFS, RAM-диск, initrd и **QlsFS** (плоская файловая система на ATA-диске).
- **Подготовка к реальному железу:** образ для загрузки с USB (`make usb.img`, безопасная запись `make usb-write`), карта памяти, которую терпят настоящие BIOS,
  без зависаний на машинах без COM-порта, таблицы ACPI выше 256 МБ доступны (проверено на 32 МБ ... 3,5 ГБ памяти в QEMU).
- **ARM:** UART-шелл, GICv2, generic timer, сброс и выключение через PSCI, многозадачность (пока без paging и ring 3).

Размер ядра сегодня: около 77 КБ кода (`make ksize`); цель v1.0.0 — 64 KiB, достигается, когда шелл, старые драйверы и тесты внутри ядра
уйдут из ring 0.

## Требования

- Linux или **Windows + WSL**
- `nasm`, `gcc` (с поддержкой `-m32`), `binutils`, `make`, `qemu-system-i386`, `python3` (тестовая обвязка QEMU)
- Только для порта ARM: `gcc-arm-none-eabi`, `qemu-system-arm`

```
sudo apt install nasm build-essential gcc-multilib python3 qemu-system-x86
sudo apt install gcc-arm-none-eabi binutils-arm-none-eabi qemu-system-arm   # только ARM
```

## Быстрый старт

**Windows**

| Ситуация | Что запустить |
|---|---|
| WSL2 работает (WSLg показывает окно QEMU) | `run.bat` (ARM: `run.bat arm`) |
| Только WSL1 (нет «Virtual Machine Platform») | `run_wsl1.bat` — собирает в WSL1, запускает QEMU для Windows |

Логи лежат в папке `logs/` рядом со скриптами (`last-build.log`, `last-errors.log`, `last-qemu.log`, ...).

**Linux / внутри WSL**

```
make                # собрать disk.img (+ disk_data.img при первом запуске)
make run            # QEMU с окном
make run-headless   # QEMU без окна, серийный лог в консоли
make arm            # собрать ядро ARM
make run-arm        # запустить в qemu-system-arm -M virt (UART в терминале)
make usb.img        # образ для USB-флешки (загрузка BIOS/CSM); make usb-write DEV=/dev/sdX безопасно записывает его
make clean
```

**Проверки**

```
make check64             # общий код должен быть 64-bit clean
make ksize               # размер ядра против бюджета
make test                # загрузчик ELF и стек пользователя на хосте (ASan/UBSan, без QEMU)
make test-handle-host  test-channel-host  test-task-host  test-revoke-host  test-caps-host  ...   # логика ядра на хосте
make test-spawn  test-result  test-ctl  test-dispatcher  test-sh  test-run  test-caps  ...        # в QEMU (каждый заодно гоняет прежние самотесты)
make test-boot  test-usbimg  test-hw  test-mmap  test-crc32                                       # загрузчик, образы, странные машины
```

Полный список целей — в `Makefile`; что проверяет каждый тест, написано в [`ARCHITECTURE.md`](ARCHITECTURE.md).

## Первые шаги в шелле

```
help                  список тем справки         help all   всё
ps                    задачи (состояние, тики CPU)   caps [N]   кто какими handles владеет и откуда каждый взялся
exec hello            запустить программу (ELF) в ring 3; шелл ждёт её результата
bg spin               запуск в фоне              jobs  stop %N  cont %N  kill %N   (через handle задачи)
sh                    шелл в ring 3 (у него экран и клавиатура до `exit`)
                      внутри:  run hello   run prog [args] --grant name:rights
dispatcher start      запустить System Dispatcher и его сервисы      (list | ping <i> <text> | kill <i> | ...)
console  kbd          экран / клавиатура — у сервисов  (on | off | kill; у kbd ещё status)
faulttest  sleeptest  blocktest  handletest  channeltest  spawntest  resulttest  ctltest  ...   самотесты (help tests)
bench                 замер загрузки и spawn, пишется в baseline.txt
write note hello      создать файл на QlsFS     cat note       вывести его
```

Готовые программы для `exec`: `hello`, `crash`, `sleeper`, `nop`, `spin`. Полный список команд: `help all`.

## Устройство репозитория

```
boot/               загрузчик x86 (две стадии)
kernel/src/         код, не зависящий от архитектуры (шелл, планировщик, handles, каналы, куча, VFS, QlsFS, ...)
kernel/include/     заголовки, не зависящие от архитектуры
kernel/hal/hal.h    контракт HAL между общим кодом и архитектурами
kernel/arch/x86/    всё, что специфично для x86 (драйверы, paging, ring 3, системные вызовы, загрузчик ELF, самотесты ядра)
kernel/arch/arm/    всё, что специфично для ARM
user/               программы ring 3 (C, статический ELF): dispatcher, сервисы, драйверы, шелл, тесты + crt0 + linker script + usys.h
tests/              host-тесты (ASan/UBSan) и тестовая обвязка QEMU
tools/              crc32 (проверка образа), usb-write.sh (безопасная запись образа)
ARCHITECTURE.md     контракт архитектуры capability-микроядра
docs/               architecture.md, hal-design.md, elf-loader.md, hardware-checklist.md, history.md
```

## Ограничения, о которых стоит знать

- Загрузчик загружает ядро не больше **512 KiB** (`make` громко падает выше этого) и отказывается запускать ядро с неверной CRC-32.
- QlsFS плоская: до 64 файлов, имена до 23 символов; `rm` не возвращает место на диске.
- В ARM пока нет paging, PMM, ring 3 и системных вызовов.
- Шелл x86 читает клавиатуру PS/2: ПК, у которого только USB-клавиатура без эмуляции PS/2 в BIOS, пока остаётся без ввода.
- Менеджер физической памяти управляет первыми 64 МБ.
- Если QEMU «перестаёт работать» после нескольких запусков, скорее всего, прежний QEMU всё ещё держит
  `disk.img` — см. раздел про неполадки в [`docs/history.md`](docs/history.md)
  (помогает `wsl --shutdown` из Windows).

## Лицензия

[MPL-2.0](https://github.com/qlsdev/QlsOS#MPL-2.0-1-ov-file) (Mozilla Public License 2.0).
