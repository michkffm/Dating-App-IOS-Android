import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Button, colors, styles } from "./experience";
import { Field } from "./live-controls";
import { displayBirthdate, monthDays, normalizeBirthdate } from "./birthdate.cjs";

const months = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
const weekdays = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

export function BirthdateField({ value, onChange }) {
  const now = new Date();
  const top = now.getFullYear();
  const low = top - 121;
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(now.getMonth());
  const [yearInput, setYearInput] = useState(String(top - 25));
  const parsed = normalizeBirthdate(value);
  const year = Number(yearInput);
  const validYear = yearInput.length === 4 && year >= low && year <= top;
  const grid = validYear ? monthDays(year, month) : null;

  function toggle() {
    if (!open && parsed) {
      const [selectedYear, selectedMonth] = parsed.split("-").map(Number);
      if (selectedYear >= low && selectedYear <= top) {
        setYearInput(String(selectedYear));
        setMonth(selectedMonth - 1);
      }
    }
    setOpen(!open);
  }

  function shift(delta) {
    const next = new Date(Date.UTC(year, month + delta, 1));
    if (next.getUTCFullYear() < low || next.getUTCFullYear() > top) return;
    setYearInput(String(next.getUTCFullYear()));
    setMonth(next.getUTCMonth());
  }

  return (
    <View style={local.field}>
      <Field label="Geburtsdatum (TT.MM.JJJJ)" value={value} onChangeText={onChange}
        autoComplete="birthdate-full" maxLength={10} placeholder="23.04.1998" />
      <Button label={open ? "Kalender schließen" : "Datum im Kalender auswählen"} secondary onPress={toggle} />
      {open && <View style={local.calendar}>
        <Field label="Geburtsjahr im Kalender" value={yearInput} onChangeText={(text) => setYearInput(text.replace(/\D/g, ""))}
          keyboardType="number-pad" maxLength={4} />
        {!validYear && <Text style={styles.body}>Geben Sie ein vierstelliges Jahr von {low} bis {top} ein.</Text>}
        <View style={local.monthRow}>
          <CalendarButton label="Vorheriger Monat" disabled={!validYear || (year === low && month === 0)} text="‹" onPress={() => shift(-1)} />
          <Text accessibilityLiveRegion="polite" style={[styles.heading, local.month]}>{months[month]}</Text>
          <CalendarButton label="Nächster Monat" disabled={!validYear || (year === top && month === 11)} text="›" onPress={() => shift(1)} />
        </View>
        <View style={local.grid}>
          {weekdays.map((day) => <Text key={day} style={[styles.body, local.cell, local.weekday]}>{day}</Text>)}
          {grid && Array.from({length:grid.offset + grid.count}, (_, i) => {
            const day = i - grid.offset + 1;
            if (day < 1) return <View key={i} style={local.cell} />;
            const iso = [year, month + 1, day].map((n) => String(n).padStart(2, "0")).join("-");
            return <View key={i} style={local.cell}>
              <CalendarButton label={day + ". " + months[month] + " " + year} text={String(day)} selected={iso === parsed}
                onPress={() => { onChange(displayBirthdate(iso)); setOpen(false); }} />
            </View>;
          })}
        </View>
      </View>}
    </View>
  );
}

function CalendarButton({ label, text, onPress, disabled = false, selected }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{disabled}}
      aria-pressed={selected} disabled={disabled} onPress={onPress}
      style={({pressed}) => [local.control, selected && local.chosen, (pressed || disabled) && styles.dim]}>
      <Text style={[styles.body, local.day, selected && local.chosenText]}>{text}</Text>
    </Pressable>
  );
}

const local = StyleSheet.create({
  field: {gap:8},
  calendar: {gap:8, borderWidth:1, borderColor:colors.border, padding:8, borderRadius:12},
  monthRow: {flexDirection:"row", alignItems:"center", justifyContent:"space-between"},
  month: {flex:1, textAlign:"center", fontSize:17},
  grid: {flexDirection:"row", flexWrap:"wrap"},
  cell: {width:"14.285%", minWidth:0},
  weekday: {textAlign:"center"},
  control: {minHeight:44, minWidth:32, alignItems:"center", justifyContent:"center", borderRadius:8},
  chosen: {backgroundColor:colors.purple},
  chosenText: {color:"#fff"},
  day: {color:colors.ink, fontWeight:"700"},
});
