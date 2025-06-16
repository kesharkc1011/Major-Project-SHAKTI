class DataStore:
    def __init__(self):
        self.max_data_points = 50
        self.temp_time = []
        self.temp_values = []
        self.press_time = []
        self.press_values = []

    def add_data(self, data_type, time_val, value):
        if data_type == "TEMP":
            self._append_data(self.temp_time, self.temp_values, time_val, value)
        elif data_type == "PRESS":
            self._append_data(self.press_time, self.press_values, time_val, value)

    def _append_data(self, time_list, value_list, time_val, value):
        if len(time_list) >= self.max_data_points:
            time_list.pop(0)
            value_list.pop(0)
        time_list.append(time_val)
        value_list.append(value)