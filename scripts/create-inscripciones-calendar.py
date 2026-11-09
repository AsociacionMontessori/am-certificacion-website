from pathlib import Path
import calendar
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
out=Path('output/pdf/Calendario_Inscripciones_AMMAC_2027.pdf')
out.parent.mkdir(parents=True, exist_ok=True)
c=canvas.Canvas(str(out),pagesize=A4);w,h=A4
c.setTitle('Calendario de inscripciones 2027 | AMMAC')
c.setAuthor('Asociación Montessori de México A.C.')
c.setFillColor(HexColor('#00758A'));c.rect(0,h-155,w,155,fill=1,stroke=0)
c.setFillColor(HexColor('#7ED957'));c.rect(38,h-46,42,5,fill=1,stroke=0)
c.setFillColor(white);c.setFont('Helvetica-Bold',11);c.drawString(38,h-68,'ASOCIACIÓN MONTESSORI DE MÉXICO A.C.')
c.setFont('Helvetica-Bold',27);c.drawString(38,h-105,'Calendario de inscripciones')
c.setFont('Helvetica',19);c.drawString(38,h-133,'Diplomados en línea · 2027')
c.setFillColor(HexColor('#40424B'));c.setFont('Helvetica',10)
c.drawString(38,h-182,'Una apertura cada mes, el último sábado, de enero a noviembre.')
c.drawString(38,h-198,'Todas las fechas corresponden a la hora de Ciudad de México.')
months=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre']
y=h-226
c.setFillColor(HexColor('#00758A'));c.roundRect(38,y-27,w-76,28,5,fill=1,stroke=0)
c.setFillColor(white);c.setFont('Helvetica-Bold',11);c.drawString(53,y-18,'MES');c.drawString(222,y-18,'APERTURA DE INSCRIPCIONES')
for m,name in enumerate(months,1):
 d=max(week[calendar.SATURDAY] for week in calendar.monthcalendar(2027,m));y-=32
 c.setFillColor(HexColor('#eef9fb') if m%2 else HexColor('#f6faF4'));c.rect(38,y-27,w-76,31,fill=1,stroke=0)
 c.setFillColor(HexColor('#40424B'));c.setFont('Helvetica-Bold',11);c.drawString(53,y-17,name)
 c.setFont('Helvetica',11);c.drawString(222,y-17,f'Sábado {d} de {name.lower()} de 2027')
y-=55;c.setFillColor(HexColor('#00758A'));c.setFont('Helvetica-Bold',12);c.drawString(38,y,'Promociones trimestrales')
c.setFillColor(HexColor('#40424B'));c.setFont('Helvetica',10)
for line in ['Del 9 al 15 de febrero, mayo, agosto y noviembre de 2027.', 'Cada promoción dura siete días; las aperturas mensuales son independientes.', 'La oferta actual permanece vigente hasta el 17 de noviembre de 2026.']:
 y-=17;c.drawString(38,y,line)
c.setStrokeColor(HexColor('#7ED957'));c.line(38,64,w-38,64)
c.setFont('Helvetica',9);c.setFillColor(HexColor('#40424B'));c.drawString(38,47,'certificacionmontessori.com  |  Calendario actualizado el 9 de noviembre de 2026')
c.showPage();c.save();print(out)
