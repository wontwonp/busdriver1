// 앱 상태 관리
class BusDriverApp {
    constructor() {
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
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderCalendar();
        this.updateMonthlySummary();
    }

    // 한국 공휴일 데이터 가져오기
    getKoreanHolidays() {
        const currentYear = this.currentDate.getFullYear();
        const holidays = {};
        
        // 양력 공휴일
        holidays[currentYear + '-01-01'] = '신정';
        holidays[currentYear + '-03-01'] = '삼일절';
        holidays[currentYear + '-05-05'] = '어린이날';
        holidays[currentYear + '-06-06'] = '현충일';
        holidays[currentYear + '-08-15'] = '광복절';
        holidays[currentYear + '-10-03'] = '개천절';
        holidays[currentYear + '-10-09'] = '한글날';
        holidays[currentYear + '-12-25'] = '크리스마스';
        
        // 음력 공휴일 (2024-2025년 기준)
        if (currentYear === 2024) {
            holidays['2024-02-10'] = '설날';
            holidays['2024-02-11'] = '설날';
            holidays['2024-02-12'] = '설날';
            holidays['2024-04-10'] = '국회의원선거';
            holidays['2024-05-15'] = '부처님오신날';
            holidays['2024-09-16'] = '추석';
            holidays['2024-09-17'] = '추석';
            holidays['2024-09-18'] = '추석';
        } else if (currentYear === 2025) {
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
        const calendarContainer = document.querySelector('.calendar-container');
        
        calendarContainer.addEventListener('touchstart', (e) => {
            this.touchStartX = e.touches[0].clientX;
        }, { passive: true });

        calendarContainer.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].clientX;
            this.handleSwipe();
        }, { passive: true });

        // 마우스 이벤트 (드래그)
        let isMouseDown = false;
        let mouseStartX = 0;

        calendarContainer.addEventListener('mousedown', (e) => {
            isMouseDown = true;
            mouseStartX = e.clientX;
            e.preventDefault();
        });

        calendarContainer.addEventListener('mousemove', (e) => {
            if (!isMouseDown) return;
            e.preventDefault();
        });

        calendarContainer.addEventListener('mouseup', (e) => {
            if (!isMouseDown) return;
            isMouseDown = false;
            
            const mouseEndX = e.clientX;
            const deltaX = mouseEndX - mouseStartX;
            
            if (Math.abs(deltaX) > this.minSwipeDistance) {
                if (deltaX > 0) {
                    this.goToPreviousMonth();
                } else {
                    this.goToNextMonth();
                }
            }
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

        // 데이터 내보내기/가져오기
        document.getElementById('exportData').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('importData').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });

        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.importData(e);
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
        this.holidays = this.getKoreanHolidays();
        this.renderCalendar();
        this.updateMonthlySummary();
    }

    // 다음 달로 이동
    goToNextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.holidays = this.getKoreanHolidays();
        this.renderCalendar();
        this.updateMonthlySummary();
    }

    // 스와이프 처리
    handleSwipe() {
        const deltaX = this.touchEndX - this.touchStartX;
        
        if (Math.abs(deltaX) > this.minSwipeDistance) {
            if (deltaX > 0) {
                // 오른쪽으로 스와이프 (이전 달)
                this.goToPreviousMonth();
            } else {
                // 왼쪽으로 스와이프 (다음 달)
                this.goToNextMonth();
            }
        }
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

        // 업무 기록 모달의 숫자 입력 필드들 (편도수만)
        const recordNumberFields = ['trips'];
        
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

    // 달력 렌더링 - 해당 월의 날짜만 표시
    renderCalendar() {
        const calendar = document.getElementById('calendar');
        const currentMonth = this.currentDate.getMonth();
        const currentYear = this.currentDate.getFullYear();
        
        // 월 표시 업데이트
        document.getElementById('currentMonth').textContent = 
            currentYear + '년 ' + (currentMonth + 1) + '월';

        // 달력 완전 초기화
        calendar.innerHTML = '';
        calendar.style.gridTemplateColumns = 'repeat(7, 1fr)';

        // 해당 월의 첫 번째 날과 마지막 날
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        const firstDayOfWeek = firstDay.getDay();

        // 빈 공간 추가 (첫 번째 날이 올바른 요일에 위치하도록)
        for (let i = 0; i < firstDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty-day';
            emptyDay.style.visibility = 'hidden';
            calendar.appendChild(emptyDay);
        }

        // 해당 월의 날짜만 추가
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentYear, currentMonth, day);
            const dayElement = this.createDayElement(date, currentMonth);
            calendar.appendChild(dayElement);
        }

        // 마지막 날 이후 빈 공간 추가 (해당 주를 완성하도록만)
        const totalCells = firstDayOfWeek + daysInMonth;
        const currentWeekCells = totalCells % 7;
        const remainingCells = currentWeekCells === 0 ? 0 : 7 - currentWeekCells;
        
        for (let i = 0; i < remainingCells; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty-day';
            emptyDay.style.visibility = 'hidden';
            calendar.appendChild(emptyDay);
        }
    }

    // 날짜 요소 생성
    createDayElement(date, currentMonth) {
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
        const holiday = this.isHoliday(date);

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

        // 대체공휴일 표시
        if (record && record.substituteHoliday) {
            const substituteInfo = document.createElement('div');
            substituteInfo.className = 'holiday-info';
            substituteInfo.style.background = 'rgba(255, 152, 0, 0.1)';
            substituteInfo.style.color = '#f57c00';
            substituteInfo.textContent = '대체공휴일';
            dayElement.appendChild(substituteInfo);
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
                document.getElementById('memo').value = record.memo || '';
                document.getElementById('substituteHoliday').checked = record.substituteHoliday || false;
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
            holidayNotice.innerHTML = '<i class="fas fa-info-circle"></i> ' + holiday + ' - 근무 시 휴일/공휴일 급여(편도수×휴일급여)와 점심비가 적용됩니다';
            document.querySelector('.modal-body').insertBefore(holidayNotice, document.querySelector('.form-group'));
        }

        // 대체공휴일 체크박스 상태에 따른 안내 메시지
        const substituteCheckbox = document.getElementById('substituteHoliday');
        const updateSubstituteNotice = () => {
            const existingNotice = document.querySelector('.substitute-notice');
            if (existingNotice) {
                existingNotice.remove();
            }
            
            if (substituteCheckbox.checked) {
                const substituteNotice = document.createElement('div');
                substituteNotice.className = 'holiday-notice substitute-notice';
                substituteNotice.style.background = '#fff3e0';
                substituteNotice.style.borderColor = '#ff9800';
                substituteNotice.style.color = '#e65100';
                substituteNotice.innerHTML = '<i class="fas fa-calendar-check"></i> 대체공휴일로 설정됨 - 휴일/공휴일 급여(편도수×휴일급여)와 점심비가 적용됩니다';
                document.querySelector('.modal-body').insertBefore(substituteNotice, document.querySelector('.form-group'));
            }
        };

        substituteCheckbox.addEventListener('change', updateSubstituteNotice);
        
        // 초기 상태 확인
        updateSubstituteNotice();

        document.getElementById('modal').classList.add('show');
    }

    // 근무 필드 토글
    toggleWorkFields(status) {
        const workFields = document.getElementById('workFields');
        const offFields = document.getElementById('offFields');
        
        // 모든 필드 숨기기
        workFields.style.display = 'none';
        offFields.style.display = 'none';
        
        if (status === 'work') {
            workFields.style.display = 'block';
        } else if (status === 'off') {
            offFields.style.display = 'block';
        }
    }

    // 폼 초기화
    clearForm() {
        document.getElementById('trips').value = '';
        document.getElementById('memo').value = '';
        document.getElementById('substituteHoliday').checked = false;
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
            record.substituteHoliday = document.getElementById('substituteHoliday').checked;
            
            const dayOfWeek = this.selectedDate.getDay(); // 0=일요일, 6=토요일
            
            // 대체공휴일로 설정된 경우, 공휴일, 토요일, 일요일인 경우 휴일 급여 적용
            if (record.substituteHoliday || holiday || dayOfWeek === 0 || dayOfWeek === 6) {
                // 휴일/공휴일 급여는 편도수에 비례하여 계산
                record.holidayPay = (record.trips || 0) * (this.settings.defaultHolidayPay || 0);
            }
            
            // 근무 시 항상 점심비 적용 (휴일/공휴일 상관없이)
            record.lunchCost = this.settings.defaultLunchCost || 0;
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
        document.getElementById('tripRate').value = (this.settings.tripRate || 0).toLocaleString();
        document.getElementById('defaultLunchCost').value = (this.settings.defaultLunchCost || 0).toLocaleString();
        document.getElementById('defaultHolidayPay').value = (this.settings.defaultHolidayPay || 0).toLocaleString();
        document.getElementById('baseSalary').value = (this.settings.baseSalary || 0).toLocaleString();
        document.getElementById('fullAttendanceDays').value = this.settings.fullAttendanceDays || 0;
        
        document.getElementById('settingsModal').classList.add('show');
    }

    // 설정 저장
    saveSettings() {
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
                    
                    // 대체공휴일로 설정된 경우, 공휴일, 토요일, 일요일 근무인 경우 휴일 급여, 아니면 일반 급여
                    if (record.substituteHoliday || holiday || dayOfWeek === 0 || dayOfWeek === 6) {
                        expectedSalary += record.holidayPay || 0;
                    } else {
                        expectedSalary += (record.trips || 0) * (this.settings.tripRate || 0);
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
            fullAttendanceDays: 0
        };
    }

    // 로컬 스토리지에 데이터 저장
    saveRecords() {
        localStorage.setItem('busDriverRecords', JSON.stringify(this.records));
    }

    saveSettingsToStorage() {
        localStorage.setItem('busDriverSettings', JSON.stringify(this.settings));
    }

    // 데이터 내보내기
    exportData() {
        const data = {
            records: this.records,
            settings: this.settings,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `버스기사데이터_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        alert('데이터가 다운로드되었습니다. 이 파일을 안전한 곳에 보관하세요.');
    }

    // 데이터 가져오기
    importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (!data.records || !data.settings) {
                    throw new Error('잘못된 데이터 형식입니다.');
                }
                
                if (confirm('기존 데이터를 모두 덮어쓰시겠습니까?')) {
                    this.records = data.records;
                    this.settings = data.settings;
                    
                    this.saveRecords();
                    this.saveSettingsToStorage();
                    
                    this.renderCalendar();
                    this.updateMonthlySummary();
                    
                    alert('데이터가 성공적으로 복원되었습니다.');
                }
            } catch (error) {
                alert('데이터 가져오기 실패: ' + error.message);
            }
        };
        
        reader.readAsText(file);
        
        // 파일 입력 초기화
        event.target.value = '';
    }
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    new BusDriverApp();
});
