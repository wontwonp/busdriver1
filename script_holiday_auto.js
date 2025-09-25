// 앱 상태 관리
class BusDriverApp {
    constructor() {
        // 항상 오늘 날짜로 설정
        this.currentDate = new Date();
        this.records = this.loadRecords();
        this.settings = this.loadSettings();
        this.selectedDate = null;
        
        // 한국 공휴일 데이터
        this.holidays = this.getKoreanHolidays();
        
        // 터치 스와이프를 위한 변수들
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.minSwipeDistance = 50; // 최소 스와이프 거리
        this.isDragging = false;
        this.dragOffset = 0;
        this.currentPageIndex = 1; // 현재 페이지 인덱스 (0: 이전달, 1: 현재달, 2: 다음달)
        
        this.init();
    }

    init() {
        // 오늘 날짜로 강제 리셋
        this.resetToToday();
        this.setupEventListeners();
        this.renderCalendar();
        this.updateMonthlySummary();
    }

    // 오늘 날짜로 강제 리셋
    resetToToday() {
        this.currentDate = new Date();
        console.log('오늘 날짜로 리셋:', this.currentDate.getFullYear() + '년 ' + (this.currentDate.getMonth() + 1) + '월');
        
        // 페이지 위치도 강제로 중앙으로 리셋
        const calendarPages = document.getElementById('calendarPages');
        if (calendarPages) {
            calendarPages.style.transition = 'none';
            calendarPages.style.transform = 'translateX(-33.333%)';
        }
    }

    // 한국 공휴일 데이터 가져오기
    getKoreanHolidays(year = null) {
        const targetYear = year || this.currentDate.getFullYear();
        const holidays = {};
        
        // 양력 공휴일
        holidays[targetYear + '-01-01'] = '신정';
        holidays[targetYear + '-03-01'] = '삼일절';
        holidays[targetYear + '-05-05'] = '어린이날';
        holidays[targetYear + '-06-06'] = '현충일';
        holidays[targetYear + '-08-15'] = '광복절';
        holidays[targetYear + '-10-03'] = '개천절';
        holidays[targetYear + '-10-09'] = '한글날';
        holidays[targetYear + '-12-25'] = '크리스마스';
        
        // 음력 공휴일 (2024-2025년 기준)
        if (targetYear === 2024) {
            holidays['2024-02-10'] = '설날';
            holidays['2024-02-11'] = '설날';
            holidays['2024-02-12'] = '설날';
            holidays['2024-04-10'] = '국회의원선거';
            holidays['2024-05-15'] = '부처님오신날';
            holidays['2024-09-16'] = '추석';
            holidays['2024-09-17'] = '추석';
            holidays['2024-09-18'] = '추석';
        } else if (targetYear === 2025) {
            holidays['2025-01-28'] = '설날';
            holidays['2025-01-29'] = '설날';
            holidays['2025-01-30'] = '설날';
            holidays['2025-05-05'] = '어린이날';
            holidays['2025-05-12'] = '부처님오신날';
            holidays['2025-10-05'] = '추석';
            holidays['2025-10-06'] = '추석';
            holidays['2025-10-07'] = '추석';
        }
        
        return holidays;
    }

    // 공휴일 확인
    isHoliday(date) {
        const dateKey = this.getDateKey(date);
        return this.holidays[dateKey] || null;
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 월 이동 버튼
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.goToPreviousMonth();
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            this.goToNextMonth();
        });

        // 터치 이벤트 (스와이프)
        const calendarWrapper = document.querySelector('.calendar-wrapper');
        
        calendarWrapper.addEventListener('touchstart', (e) => {
            this.touchStartX = e.touches[0].clientX;
            this.isDragging = true;
            this.dragOffset = 0;
            document.getElementById('calendarPages').classList.add('dragging');
        }, { passive: true });

        calendarWrapper.addEventListener('touchmove', (e) => {
            if (!this.isDragging) return;
            
            const currentX = e.touches[0].clientX;
            this.dragOffset = currentX - this.touchStartX;
            this.updateDragPosition();
        }, { passive: true });

        calendarWrapper.addEventListener('touchend', (e) => {
            if (!this.isDragging) return;
            
            this.touchEndX = e.changedTouches[0].clientX;
            this.isDragging = false;
            document.getElementById('calendarPages').classList.remove('dragging');
            this.handleSwipeEnd();
        }, { passive: true });

        // 마우스 이벤트 (드래그)
        let isMouseDown = false;
        let mouseStartX = 0;

        calendarWrapper.addEventListener('mousedown', (e) => {
            isMouseDown = true;
            mouseStartX = e.clientX;
            this.isDragging = true;
            this.dragOffset = 0;
            document.getElementById('calendarPages').classList.add('dragging');
            // 텍스트 선택 방지
            e.preventDefault();
            document.body.style.userSelect = 'none';
        });

        calendarWrapper.addEventListener('mousemove', (e) => {
            if (!isMouseDown || !this.isDragging) return;
            
            const currentX = e.clientX;
            this.dragOffset = currentX - mouseStartX;
            this.updateDragPosition();
            e.preventDefault();
        });

        calendarWrapper.addEventListener('mouseup', (e) => {
            if (!isMouseDown || !this.isDragging) return;
            
            isMouseDown = false;
            this.isDragging = false;
            document.getElementById('calendarPages').classList.remove('dragging');
            // 텍스트 선택 복원
            document.body.style.userSelect = '';
            this.handleSwipeEnd();
        });

        // 설정 버튼
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.openSettingsModal();
        });

        // 모달 관련
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('closeSettingsModal').addEventListener('click', () => {
            this.closeSettingsModal();
        });

        // 근무 상태 변경
        document.querySelectorAll('input[name="workStatus"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.toggleWorkFields(e.target.value);
            });
        });

        // 저장/삭제 버튼
        document.getElementById('saveRecord').addEventListener('click', () => {
            this.saveRecord();
        });

        document.getElementById('deleteRecord').addEventListener('click', () => {
            this.deleteRecord();
        });

        document.getElementById('saveSettings').addEventListener('click', () => {
            this.saveSettings();
        });

        // 숫자 입력 필드에 콤마 포맷팅 추가
        this.setupNumberFormatting();

        // 모달 외부 클릭으로 닫기
        document.getElementById('modal').addEventListener('click', (e) => {
            if (e.target.id === 'modal') {
                this.closeModal();
            }
        });

        document.getElementById('settingsModal').addEventListener('click', (e) => {
            if (e.target.id === 'settingsModal') {
                this.closeSettingsModal();
            }
        });
    }

    // 이전 달로 이동
    goToPreviousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        console.log('이전 달로 이동:', this.currentDate.getFullYear() + '년 ' + (this.currentDate.getMonth() + 1) + '월');
        this.renderCalendar();
        this.updateMonthlySummary();
        
        // 페이지 위치를 즉시 중앙으로 리셋 (애니메이션 없이)
        const calendarPages = document.getElementById('calendarPages');
        calendarPages.style.transition = 'none';
        calendarPages.style.transform = 'translateX(-33.333%)';
        
        // 다음 프레임에서 transition 복원
        requestAnimationFrame(() => {
            calendarPages.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        });
    }

    // 다음 달로 이동
    goToNextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        console.log('다음 달로 이동:', this.currentDate.getFullYear() + '년 ' + (this.currentDate.getMonth() + 1) + '월');
        this.renderCalendar();
        this.updateMonthlySummary();
        
        // 페이지 위치를 즉시 중앙으로 리셋 (애니메이션 없이)
        const calendarPages = document.getElementById('calendarPages');
        calendarPages.style.transition = 'none';
        calendarPages.style.transform = 'translateX(-33.333%)';
        
        // 다음 프레임에서 transition 복원
        requestAnimationFrame(() => {
            calendarPages.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        });
    }


    // 드래그 위치 업데이트
    updateDragPosition() {
        const calendarPages = document.getElementById('calendarPages');
        const wrapper = document.querySelector('.calendar-wrapper');
        
        // 드래그 중에는 이전/다음 달이 보이도록 전체 범위에서 이동
        const dragPercent = (this.dragOffset / wrapper.offsetWidth) * 100;
        const totalTransform = -33.333 + dragPercent; // 중앙에서 시작해서 드래그만큼 이동
        
        calendarPages.style.transform = `translateX(${totalTransform}%)`;
    }

    // 스와이프 종료 처리
    handleSwipeEnd() {
        if (Math.abs(this.dragOffset) > this.minSwipeDistance) {
            if (this.dragOffset > 0) {
                // 오른쪽으로 스와이프 (이전 달)
                this.goToPreviousMonth();
            } else {
                // 왼쪽으로 스와이프 (다음 달)
                this.goToNextMonth();
            }
        } else {
            // 원래 위치로 되돌리기
            this.snapToCurrentPage();
        }
    }

    // 현재 페이지로 스냅
    snapToCurrentPage() {
        const calendarPages = document.getElementById('calendarPages');
        calendarPages.style.transform = `translateX(${-this.currentPageIndex * 33.333}%)`;
    }


    // 숫자 포맷팅 설정
    setupNumberFormatting() {
        // 설정 모달의 숫자 입력 필드들
        const numberFields = ['tripRate', 'defaultLunchCost', 'defaultHolidayPay', 'baseSalary', 'fullAttendanceDays'];
        
        numberFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('input', (e) => {
                    this.formatNumberInput(e.target);
                });
                
                field.addEventListener('blur', (e) => {
                    this.formatNumberInput(e.target);
                });
            }
        });

        // 업무 기록 모달의 숫자 입력 필드들 (편도수, 개별 편도금액)
        const recordNumberFields = ['trips', 'individualTripRate'];
        
        recordNumberFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('input', (e) => {
                    this.formatNumberInput(e.target);
                });
                
                field.addEventListener('blur', (e) => {
                    this.formatNumberInput(e.target);
                });
            }
        });
    }

    // 숫자 입력 포맷팅
    formatNumberInput(input) {
        let value = input.value.replace(/[^0-9]/g, ''); // 숫자만 추출
        
        if (value === '') {
            input.value = '';
            return;
        }
        
        // 숫자에 콤마 추가
        const formattedValue = parseInt(value).toLocaleString();
        input.value = formattedValue;
    }

    // 콤마가 포함된 문자열을 숫자로 변환
    parseFormattedNumber(str) {
        if (!str) return 0;
        return parseInt(str.replace(/,/g, '')) || 0;
    }

    // 달력 렌더링 - 이전 달, 현재 달, 다음 달을 함께 렌더링
    renderCalendar() {
        // 확실히 오늘 날짜로 설정
        this.currentDate = new Date();
        
        const calendar = document.getElementById('calendar');
        const prevCalendar = document.getElementById('prevCalendar');
        const nextCalendar = document.getElementById('nextCalendar');
        const currentMonth = this.currentDate.getMonth();
        const currentYear = this.currentDate.getFullYear();
        
        console.log('렌더링 중인 달:', currentYear + '년 ' + (currentMonth + 1) + '월');
        
        // 월 표시 업데이트
        document.getElementById('currentMonth').textContent = 
            currentYear + '년 ' + (currentMonth + 1) + '월';

        // 현재 달 달력 렌더링 (중앙에 표시될 달력)
        this.renderCalendarForElement(calendar, currentYear, currentMonth);
        
        // 이전 달 달력 렌더링
        const prevDate = new Date(currentYear, currentMonth - 1);
        this.renderCalendarForElement(prevCalendar, prevDate.getFullYear(), prevDate.getMonth());
        
        // 다음 달 달력 렌더링
        const nextDate = new Date(currentYear, currentMonth + 1);
        this.renderCalendarForElement(nextCalendar, nextDate.getFullYear(), nextDate.getMonth());
        
        // 페이지 위치를 중앙으로 확실히 설정
        const calendarPages = document.getElementById('calendarPages');
        calendarPages.style.transition = 'none';
        calendarPages.style.transform = 'translateX(-33.333%)';
        setTimeout(() => {
            calendarPages.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        }, 10);
    }

    // 특정 요소에 달력 렌더링
    renderCalendarForElement(element, year, month) {
        element.innerHTML = '';
        element.style.gridTemplateColumns = 'repeat(7, 1fr)';

        // 해당 월의 첫 번째 날과 마지막 날
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const firstDayOfWeek = firstDay.getDay();

        // 빈 공간 추가 (첫 번째 날이 올바른 요일에 위치하도록)
        for (let i = 0; i < firstDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty-day';
            emptyDay.style.visibility = 'hidden';
            element.appendChild(emptyDay);
        }

        // 해당 월의 날짜만 추가
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dayElement = this.createDayElement(date, month, year);
            element.appendChild(dayElement);
        }

        // 마지막 날 이후 빈 공간 추가 (해당 주를 완성하도록만)
        const totalCells = firstDayOfWeek + daysInMonth;
        const currentWeekCells = totalCells % 7;
        const remainingCells = currentWeekCells === 0 ? 0 : 7 - currentWeekCells;
        
        for (let i = 0; i < remainingCells; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty-day';
            emptyDay.style.visibility = 'hidden';
            element.appendChild(emptyDay);
        }
    }


    // 날짜 요소 생성
    createDayElement(date, currentMonth, year = null) {
        // 해당 월이 아닌 경우 빈 요소 반환
        if (date.getMonth() !== currentMonth) {
            const emptyElement = document.createElement('div');
            emptyElement.className = 'calendar-day empty-day';
            return emptyElement;
        }

        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        const isToday = this.isToday(date);
        const record = this.getRecord(date);
        const dayOfWeek = date.getDay(); // 0=일요일, 6=토요일
        
        // 해당 년도의 공휴일 데이터 사용
        const targetYear = year || date.getFullYear();
        const yearHolidays = this.getKoreanHolidays(targetYear);
        const dateKey = this.getDateKey(date);
        const holiday = yearHolidays[dateKey] || null;

        if (isToday) {
            dayElement.classList.add('today');
        }

        // 공휴일 색상 적용
        if (holiday) {
            dayElement.classList.add('holiday');
        }

        // 주말 색상 적용
        if (dayOfWeek === 0) { // 일요일
            dayElement.classList.add('sunday');
        } else if (dayOfWeek === 6) { // 토요일
            dayElement.classList.add('saturday');
        }

        if (record) {
            if (record.status === 'work') {
                dayElement.classList.add('work-day');
            } else if (record.status === 'off') {
                dayElement.classList.add('off-day');
            }
        }

        // 날짜 번호
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = date.getDate();
        dayElement.appendChild(dayNumber);

        // 공휴일 표시
        if (holiday) {
            const holidayInfo = document.createElement('div');
            holidayInfo.className = 'holiday-info';
            holidayInfo.textContent = holiday;
            dayElement.appendChild(holidayInfo);
        }

        // 날짜 정보 (메모 포함)
        if (record) {
            const dayInfo = document.createElement('div');
            dayInfo.className = 'day-info';
            
            if (record.status === 'work') {
                dayInfo.innerHTML = '<i class="fas fa-bus"></i>' + (record.trips || 0) + '회';
                if (record.memo) {
                    dayInfo.innerHTML += '<br><i class="fas fa-sticky-note"></i>' + record.memo;
                }
            } else if (record.status === 'off') {
                dayInfo.innerHTML = '<i class="fas fa-home"></i>휴무';
                if (record.memo) {
                    dayInfo.innerHTML += '<br><i class="fas fa-sticky-note"></i>' + record.memo;
                }
            }
            
            dayElement.appendChild(dayInfo);
        }

        // 클릭 이벤트
        dayElement.addEventListener('click', () => {
            this.openRecordModal(date);
        });

        return dayElement;
    }

    // 오늘 날짜 확인
    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    // 기록 가져오기
    getRecord(date) {
        const dateKey = this.getDateKey(date);
        return this.records[dateKey] || null;
    }

    // 날짜 키 생성
    getDateKey(date) {
        return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
    }

    // 공휴일 확인
    isHoliday(date) {
        const dateKey = this.getDateKey(date);
        const year = date.getFullYear();
        const yearHolidays = this.getKoreanHolidays(year);
        return yearHolidays[dateKey] || null;
    }

    // 기록 모달 열기
    openRecordModal(date) {
        this.selectedDate = date;
        const record = this.getRecord(date);
        const holiday = this.isHoliday(date);
        
        document.getElementById('modalTitle').textContent = 
            date.getFullYear() + '년 ' + (date.getMonth() + 1) + '월 ' + date.getDate() + '일';

        if (record) {
            // 기존 기록이 있는 경우
            document.querySelector('input[name="workStatus"][value="' + record.status + '"]').checked = true;
            this.toggleWorkFields(record.status);
            
            if (record.status === 'work') {
                document.getElementById('trips').value = record.trips || '';
                document.getElementById('individualTripRate').value = record.individualTripRate ? record.individualTripRate.toLocaleString() : '';
                document.getElementById('memo').value = record.memo || '';
            } else if (record.status === 'off') {
                document.getElementById('memo').value = record.memo || '';
            }
        } else {
            // 새 기록인 경우
            document.querySelector('input[name="workStatus"][value="work"]').checked = true;
            this.toggleWorkFields('work');
            this.clearForm();
        }

        // 기존 안내 메시지 모두 제거
        const existingNotices = document.querySelectorAll('.holiday-notice');
        existingNotices.forEach(notice => notice.remove());

        // 공휴일인 경우 안내 메시지 표시
        if (holiday) {
            const holidayNotice = document.createElement('div');
            holidayNotice.className = 'holiday-notice';
            holidayNotice.innerHTML = '<i class="fas fa-info-circle"></i> ' + holiday + ' - 근무 시 휴일/공휴일 급여가 적용됩니다';
            document.querySelector('.modal-body').insertBefore(holidayNotice, document.querySelector('.form-group'));
        }

        document.getElementById('modal').classList.add('show');
    }

    // 근무 필드 토글
    toggleWorkFields(status) {
        const workFields = document.getElementById('workFields');
        const offFields = document.getElementById('offFields');
        const individualTripRateGroup = document.getElementById('individualTripRateGroup');
        
        // 모든 필드 숨기기
        workFields.style.display = 'none';
        offFields.style.display = 'none';
        
        if (status === 'work') {
            workFields.style.display = 'block';
            // 편도급여가 고정되어 있으면 개별 편도금액 입력 필드 숨기기
            if (this.settings.useTripRate) {
                individualTripRateGroup.style.display = 'none';
            } else {
                individualTripRateGroup.style.display = 'block';
            }
        } else if (status === 'off') {
            offFields.style.display = 'block';
        }
    }

    // 폼 초기화
    clearForm() {
        document.getElementById('trips').value = '';
        document.getElementById('individualTripRate').value = '';
        document.getElementById('memo').value = '';
    }

    // 기록 저장
    saveRecord() {
        if (!this.selectedDate) return;

        const status = document.querySelector('input[name="workStatus"]:checked').value;
        const dateKey = this.getDateKey(this.selectedDate);
        const holiday = this.isHoliday(this.selectedDate);
        
        let record = {
            status: status,
            date: this.selectedDate.toISOString()
        };

        if (status === 'work') {
            record.trips = this.parseFormattedNumber(document.getElementById('trips').value);
            record.memo = document.getElementById('memo').value;
            
            const dayOfWeek = this.selectedDate.getDay(); // 0=일요일, 6=토요일
            
            // 공휴일인 경우 휴일 급여 적용
            if (holiday) {
                record.holidayPay = this.settings.defaultHolidayPay || 0;
                record.lunchCost = 0; // 공휴일 근무 시 점심비 없음
            } else {
                // 주말 근무 시에도 점심비 적용
                record.lunchCost = this.settings.defaultLunchCost || 0;
                
                // 체크박스 상태에 따라 급여 계산 방식 결정
                if (this.settings.useTripRate) {
                    // 설정의 편도당 급여 사용
                    record.tripRate = this.settings.tripRate || 0;
                } else {
                    // 개별 편도당 급여 사용
                    record.individualTripRate = this.parseFormattedNumber(document.getElementById('individualTripRate').value);
                }
            }
        } else if (status === 'off') {
            record.memo = document.getElementById('memo').value;
        }

        this.records[dateKey] = record;
        this.saveRecords();
        
        this.closeModal();
        this.renderCalendar();
        this.updateMonthlySummary();
    }

    // 기록 삭제
    deleteRecord() {
        if (!this.selectedDate) return;

        const dateKey = this.getDateKey(this.selectedDate);
        delete this.records[dateKey];
        this.saveRecords();
        
        this.closeModal();
        this.renderCalendar();
        this.updateMonthlySummary();
    }

    // 설정 모달 열기
    openSettingsModal() {
        document.getElementById('useTripRate').checked = this.settings.useTripRate !== false;
        document.getElementById('tripRate').value = (this.settings.tripRate || 0).toLocaleString();
        document.getElementById('defaultLunchCost').value = (this.settings.defaultLunchCost || 0).toLocaleString();
        document.getElementById('defaultHolidayPay').value = (this.settings.defaultHolidayPay || 0).toLocaleString();
        document.getElementById('baseSalary').value = (this.settings.baseSalary || 0).toLocaleString();
        document.getElementById('fullAttendanceDays').value = this.settings.fullAttendanceDays || 0;
        
        document.getElementById('settingsModal').classList.add('show');
    }

    // 설정 저장
    saveSettings() {
        this.settings.useTripRate = document.getElementById('useTripRate').checked;
        this.settings.tripRate = this.parseFormattedNumber(document.getElementById('tripRate').value);
        this.settings.defaultLunchCost = this.parseFormattedNumber(document.getElementById('defaultLunchCost').value);
        this.settings.defaultHolidayPay = this.parseFormattedNumber(document.getElementById('defaultHolidayPay').value);
        this.settings.baseSalary = this.parseFormattedNumber(document.getElementById('baseSalary').value);
        this.settings.fullAttendanceDays = parseInt(document.getElementById('fullAttendanceDays').value) || 0;
        
        this.saveSettingsToStorage();
        this.closeSettingsModal();
        this.updateMonthlySummary();
    }

    // 월별 요약 업데이트
    updateMonthlySummary() {
        const currentMonth = this.currentDate.getMonth();
        const currentYear = this.currentDate.getFullYear();
        
        let workDays = 0;
        let totalTrips = 0;
        let lunchTotal = 0;
        let expectedSalary = 0;
        let fullAttendanceBonus = 0;

        // 해당 월의 모든 날짜 확인
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentYear, currentMonth, day);
            const dateKey = this.getDateKey(date);
            const record = this.records[dateKey];
            const holiday = this.isHoliday(date);
            
            if (record) {
                if (record.status === 'work') {
                    workDays++;
                    totalTrips += record.trips || 0;
                    lunchTotal += record.lunchCost || 0;
                    
                    const dayOfWeek = date.getDay(); // 0=일요일, 6=토요일
                    
                    // 공휴일 근무인 경우 휴일 급여, 아니면 일반 급여
                    if (holiday) {
                        expectedSalary += record.holidayPay || 0;
                    } else {
                        // 개별 편도금액이 있으면 사용, 없으면 설정의 편도당 급여 사용
                        const tripRate = record.individualTripRate || this.settings.tripRate || 0;
                        expectedSalary += (record.trips || 0) * tripRate;
                    }
                }
            }
        }

        // 만근 보너스 계산
        if (workDays >= this.settings.fullAttendanceDays && this.settings.fullAttendanceDays > 0) {
            // 만근 달성 시 전체 기본급 지급
            fullAttendanceBonus = this.settings.baseSalary || 0;
            expectedSalary += fullAttendanceBonus;
        } else if (workDays > 0 && this.settings.fullAttendanceDays > 0) {
            // 만근 실패 시 말일 입력 확인 후 부분 지급
            const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
            const lastDayRecord = this.getRecord(new Date(currentYear, currentMonth, lastDayOfMonth));
            
            console.log('만근 실패 - 말일 확인:', {
                lastDayOfMonth,
                lastDayRecord,
                workDays,
                fullAttendanceDays: this.settings.fullAttendanceDays,
                baseSalary: this.settings.baseSalary
            });
            
            if (lastDayRecord && lastDayRecord.status === 'work' && (lastDayRecord.trips > 0 || lastDayRecord.memo)) {
                // 말일에 근무 기록이 있고 편도수나 메모 중 하나라도 있으면 부분 지급
                const partialBonus = Math.floor((this.settings.baseSalary || 0) * (workDays / this.settings.fullAttendanceDays));
                fullAttendanceBonus = partialBonus;
                expectedSalary += partialBonus;
                console.log('부분 지급 계산:', partialBonus);
            }
        }

        document.getElementById('workDays').textContent = workDays + '일';
        document.getElementById('totalTrips').textContent = totalTrips + '회';
        document.getElementById('lunchTotal').textContent = lunchTotal.toLocaleString() + '원';
        document.getElementById('expectedSalary').textContent = expectedSalary.toLocaleString() + '원';
    }

    // 모달 닫기
    closeModal() {
        document.getElementById('modal').classList.remove('show');
        this.selectedDate = null;
    }

    closeSettingsModal() {
        document.getElementById('settingsModal').classList.remove('show');
    }

    // 로컬 스토리지에서 데이터 로드
    loadRecords() {
        const data = localStorage.getItem('busDriverRecords');
        return data ? JSON.parse(data) : {};
    }

    loadSettings() {
        const data = localStorage.getItem('busDriverSettings');
        return data ? JSON.parse(data) : {
            tripRate: 0,
            defaultLunchCost: 0,
            defaultHolidayPay: 0,
            baseSalary: 0,
            fullAttendanceDays: 0,
            useTripRate: true
        };
    }

    // 로컬 스토리지에 데이터 저장
    saveRecords() {
        localStorage.setItem('busDriverRecords', JSON.stringify(this.records));
    }

    saveSettingsToStorage() {
        localStorage.setItem('busDriverSettings', JSON.stringify(this.settings));
    }
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    new BusDriverApp();
});

