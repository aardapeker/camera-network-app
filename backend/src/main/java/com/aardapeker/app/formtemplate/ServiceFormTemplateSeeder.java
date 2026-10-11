package com.aardapeker.app.formtemplate;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Seeds a starter set of service templates the first time the app runs against an
 * empty table. The wording is taken from the company's existing paper forms. They
 * are ordinary rows - edit or delete them from the admin panel.
 */
@Service
public class ServiceFormTemplateSeeder implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(ServiceFormTemplateSeeder.class);

    private final ServiceFormTemplateRepository repository;

    public ServiceFormTemplateSeeder(ServiceFormTemplateRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) {
        if (repository.count() > 0) return;

        repository.saveAll(List.of(
                ServiceFormTemplate.builder()
                        .nameTr("Kamera Arızası")
                        .nameEn("Camera Fault")
                        .orderIndex(0)
                        .promptHint("""
                                Bir veya birden fazla kamerada görüntü kaybı, gece görüş arızası, lens \
                                arızası veya kameranın off konuma geçmesi. Teknisyen genelde kamerayı \
                                numarası, IP'si ve kanalı ile tanımlar; arızanın sebebini (yıldırım, \
                                adaptör, kablo, PoE portu), yapılan işlemi ve kameranın kaçta off olup \
                                kaçta devreye alındığını söyler. Off ve devreye alma saatleri verilmişse \
                                mutlaka yaz.""")
                        .faultExample("Kamera arızası")
                        .serviceExample("""
                                Kurulu bulunan kamera sisteminin güvenlikli alanda 1 adet kamera arızası \
                                mevcuttur. İlgili kameraya bakılarak adaptörü değiştirilmiştir. Kameranın \
                                IP'si 1.16'dır, ana cihazda 33. kanaldır. 03.08.2026 tarihinde saat \
                                11:10'da off konuma geçmiştir, devreye alındığı tarih ise 18.08.2026 saat \
                                17:45'dir. Tüm cihazlar kontrol edilmiştir.

                                Yıldırım düşmesi sonucu arızaya geçen 8 nolu 172.50.50.108 ip'li kameranın \
                                arızası giderilerek devreye alınmıştır. Yapılan kontrollerde sistemin \
                                sorunsuz çalıştığı gözlemlenmiştir.""")
                        .build(),

                ServiceFormTemplate.builder()
                        .nameTr("Hat Kopması / Kablo Arızası")
                        .nameEn("Line Cut / Cable Fault")
                        .orderIndex(1)
                        .promptHint("""
                                Kamera veya data hattının kopması, ezilmesi, konnektör/keystone arızası. \
                                Teknisyen genelde kopmanın yerini, etkilenen kamerayı, yapılan ek veya \
                                yeni kablo çekimini, kullanılan malzemeyi (CAT6, buat, keystone, kanal) ve \
                                metrajını söyler. Görüntü kaybı ve devreye alma saatleri verilmişse yaz. \
                                Metrajlı malzemeleri products içine metre değeriyle ekle.""")
                        .faultExample("Kamera arızası")
                        .serviceExample("""
                                Kurulu bulunan kamera sisteminin plaka kamerasının kablosunun koptuğu \
                                görülmüştür. Kablo yerinden eklenerek kamera devreye alınmıştır. \
                                30.07.2026 ve 31.07.2026'da görüntü kaybı mevcuttur, saatleri ise 18:02'de \
                                off, 18:40'da çalışmıştır. Diğer gün için ise 09:05'te off, 09:31'de \
                                çalıştırılmıştır.""")
                        .build(),

                ServiceFormTemplate.builder()
                        .nameTr("Çevre / Fiber Hattı Arızası")
                        .nameEn("Perimeter / Fiber Link Fault")
                        .orderIndex(2)
                        .promptHint("""
                                Çevre kameralarının veya bir binalar arası hattın komple çalışmaması. \
                                Genelde fiber çevirici (media konverter), switch uplink portu veya saha \
                                kabini kaynaklıdır. Teknisyen hangi kabinde ne değiştirildiğini ve hâlâ \
                                arızalı kalan noktaları söyler. Giderilemeyen arızaları "Not:" ile ayrı \
                                satırda yaz.""")
                        .faultExample("Çevre kamera arızası")
                        .serviceExample("""
                                Kurulu bulunan kamera sisteminin çevre hatlarının çalışmadığı görülmüştür. \
                                İlgili kabine gidilerek fiber çeviricinin çalışmadığı saptanmıştır. İlgili \
                                çevre kabini ve güvenlik masasındaki çeviriciler değişimi yapılarak \
                                kameralar devreye alınmıştır.

                                Not: Mescitin katındaki network kabinindeki switch'in uplink portları \
                                arızalıdır. 1 adet depo içerisindeki rack cross kanası arızalıdır.""")
                        .build(),

                ServiceFormTemplate.builder()
                        .nameTr("Kayıt Cihazı (NVR/DVR) Değişimi")
                        .nameEn("Recorder (NVR/DVR) Replacement")
                        .orderIndex(3)
                        .promptHint("""
                                Kayıt cihazının arızalanması, değiştirilmesi veya disk arızası. Teknisyen \
                                genelde arızalı cihazdaki HDD'lerin yeni cihaza takıldığını, arızalı \
                                cihazdaki kayıtların hangi tarih aralığında mevcut olduğunu, yeni cihazın \
                                kaçta kayda başladığını, arızalı cihazın servise alınıp alınmadığını ve \
                                antrepo/site kodunu söyler. Seri numarası ve kod satırlarını sonda ayrı \
                                satıra yaz.""")
                        .faultExample("Antrepo NVR değişimi")
                        .serviceExample("""
                                Bursa Antrepoda bulunan yedek NVR cihazı arızalı olup yenisiyle değişimi \
                                yapılmıştır. Arızalı olan NVR cihazında bulunan 8TB x 14 HDD'ler yeni \
                                cihaza takılmıştır. Arızalı olan cihazda 11.02.2025 - 02.07.2026 arası \
                                kayıtlar mevcuttur. Yeni kurulan cihaz 20.07.2026 12:00 kayıta \
                                başlamıştır. Arızalı cihaz tarafımızca servise alınmak üzere alınmıştır.

                                Bursa Antrepo Kodu = A00000001""")
                        .build(),

                ServiceFormTemplate.builder()
                        .nameTr("Sistem Kurulumu")
                        .nameEn("System Installation")
                        .orderIndex(4)
                        .promptHint("""
                                Yeni kamera sistemi kurulumu. Teknisyen genelde kaç adet kamera \
                                kurulduğunu, kabin kurulumunu, kablolamayı, sistem odası düzenlemesini ve \
                                disklerin RAID durumunu söyler. Her iş kalemi ayrı bir cümle olarak \
                                yazılır. Kullanılan tüm malzemeleri adet/metraj ile products içine ekle. \
                                NVR seri numarasını sonda ayrı satıra yaz.""")
                        .faultExample("Sistem kurulumu")
                        .serviceExample("""
                                Antrepo sahasına 17 adet kamera kurulumu yapılmıştır.
                                Depo içerisine kabin kurulumu yapılmıştır.
                                Tüm kameraların kablolaması yapılmıştır.
                                Sistem odası ve saha kabini arasında elektrik ve data kablolaması \
                                yapılmıştır.
                                Sistem odasının düzenlenmesi yapılmıştır.
                                Hddler raid sisteminde çalışmaktadır.

                                NVR SN: XX0000EXAMPLE01""")
                        .build(),

                ServiceFormTemplate.builder()
                        .nameTr("Kamera Montajı / Yer Değişimi")
                        .nameEn("Camera Mounting / Relocation")
                        .orderIndex(5)
                        .promptHint("""
                                Mevcut bir kameranın sökülüp başka noktaya montajı ya da yeni noktalara \
                                kablo çekilip kamera montajı yapılması. Teknisyen genelde hangi bölgeye \
                                kaç adet kablo çekilip kamera monte edildiğini, montaj aparatını ve varsa \
                                monitör/dönüştürücü bağlantısını söyler.""")
                        .faultExample("Kamera yer değişimi")
                        .serviceExample("""
                                Tesis girişinde bulunan kamera önü engellendiğinden seyyar aparatlar \
                                takılıp montajı yapılmıştır.

                                Sistem odasında bulunan monitörde ise HDMI dönüştürücü arızalı olduğu için \
                                direkt VGA girişine takılmıştır.""")
                        .build(),

                ServiceFormTemplate.builder()
                        .nameTr("Bakım")
                        .nameEn("Maintenance")
                        .orderIndex(6)
                        .promptHint("""
                                Planlı bakım veya kayıt kontrolü ziyareti. Teknisyen genelde hangi \
                                depolarda/cihazlarda kontrol yapıldığını, kayıt sürelerini, erişimde sorun \
                                olup olmadığını, yetkiliye bilgi verilip verilmediğini ve değişmesi \
                                gereken cihazları söyler. Antrepo/site kodlarını sonda ayrı satıra yaz. \
                                Sistemin teslim durumunu deliveryNotes alanına yaz.""")
                        .faultExample("Bakım")
                        .serviceExample("""
                                Bursa ve Mudanya olmak üzere 2 adet antrepodaki kamera sistemlerindeki \
                                kameraların ve cihazların kontrolleri yapılmıştır. Her iki depoda kayıt \
                                süreleri 400+ gün olarak mevcuttur. Bursa ve Mudanya depoda ses özelliği \
                                olmayan kameraların değişmesi gerekmektedir.

                                Bursa Antrepo Kodu = A00000001
                                Mudanya Antrepo Kodu = A00000002""")
                        .build(),

                ServiceFormTemplate.builder()
                        .nameTr("Bakımda Tespit Edilen Arızalar")
                        .nameEn("Faults Found During Maintenance")
                        .orderIndex(7)
                        .promptHint("""
                                Bakım sırasında tespit edilen ama giderilmeyen arızaların listesi. \
                                Cihaz cihaz gruplanır ("1. Cihazda", "2. Cihazda") ve her kamera numarası \
                                ile arıza tarihi yazılır. Onarım yapılmadığı için geçmiş zaman "arızalanmış \
                                / sökülmüş" kipi kullanılır. Liste halinde yaz, cümleleri birleştirme.""")
                        .faultExample("Bakımda tespit edilen arızalar")
                        .serviceExample("""
                                1. Cihazda
                                8, 9 ve 39 nolu kameralar 03.07.26 tarihinde sökülmüş.
                                22 nolu kamera 14.07.26 tarihinde arızalanmış.
                                33 nolu kameranın lensi arızalanmış.
                                25 nolu kamera 05.07.26 tarihinde sert fiziki müdahale ile sökülmüş.

                                2. Cihazda
                                16 nolu kameranın lensi arızalanmış.""")
                        .build(),

                ServiceFormTemplate.builder()
                        .nameTr("Kamera Değişimi")
                        .nameEn("Camera Replacement")
                        .orderIndex(8)
                        .promptHint("""
                                Kusurlu veya arızalı kameraların yenisiyle değiştirilmesi. Teknisyen \
                                genelde hangi numaralı kameraların değiştirildiğini, yeni takılan \
                                kameraların numara/IP/seri numarası bilgilerini, işlemin kimin \
                                gözetiminde yapıldığını ve sökülen kameraların kime teslim edildiğini \
                                söyler. Yeni kamera bilgilerini "Yeni takılan kamera bilgileri:" başlığı \
                                altında satır satır yaz.""")
                        .faultExample("Kamera değişimi")
                        .serviceExample("""
                                Gümrük memuru tarafından kusurlu bulunan 1, 2, 5, 6, 7 ve 10 nolu \
                                kameraların değişimi yapılmıştır.

                                Yeni takılan kamera bilgileri:
                                1 nolu   192.168.1.201   BD07DC3PAG303CC
                                2 nolu   192.168.1.202   BD07DC3PAG46E99
                                5 nolu   192.168.1.205   BD07DC3PAGC6F26

                                Yeni montajlanan kameranın kontrol ve ayarlamaları yapılmıştır. Tüm \
                                işlemler gümrük memuru gözetiminde yapılmıştır. Sökülen 6 adet kamera \
                                depo sorumlusuna teslim edilmiştir.""")
                        .build(),

                ServiceFormTemplate.builder()
                        .nameTr("Alarm Sistemi Arızası")
                        .nameEn("Alarm System Fault")
                        .orderIndex(9)
                        .promptHint("""
                                Alarm paneli, PIR dedektör, keypad, siren veya zone arızası. Teknisyen \
                                genelde hangi depoda hangi cihazın arızalı/kırık olduğunu, kaçıncı zonun \
                                etkilendiğini, alarm kurma-açma testini ve alarm izleme merkezi ile \
                                haberleşmenin kontrol edilip edilmediğini söyler. Değişmesi gereken ama \
                                değişmeyen parçaları ayrı satırda belirt.""")
                        .faultExample("Alarm arızası")
                        .serviceExample("""
                                Yeni depo içerisindeki alarm sistemi kontrolü yapılmıştır. İlgili depo \
                                içerisinde 1 adet PIR algılama dedektörü kırıldığı için yenisi ile \
                                değişimi gerekmektedir, ilgili panelin 1'inci zonu arızalıdır.

                                Merkez depoda alarm sisteminin keşfi su aldığı için keypad kontrol \
                                edilmiştir. Buat üstüne alınmıştır. 1 adet PIR kapağı kırılmıştır, yenisi \
                                ile değişimi gerekmektedir.

                                Her iki depoda da alarm kurma-açma ve PIR dedektör kontrolleri \
                                yapılmıştır. Alarm izleme merkezi ile haberleşmeleri mevcuttur.""")
                        .build(),

                ServiceFormTemplate.builder()
                        .nameTr("Demontaj / Montaj (Taşıma)")
                        .nameEn("Dismantle / Reinstall (Relocation)")
                        .orderIndex(10)
                        .promptHint("""
                                Bir sistemin sökülüp başka bir yere taşınarak yeniden kurulması. \
                                Teknisyen genelde nereden nereye taşındığını ve sistem sistem neyin \
                                yapıldığını (kamera sistemi, alarm sistemi, data kabini, kartlı geçiş) \
                                söyler. Her sistemi ayrı satırda "Sistem -> yapılan işler" biçiminde yaz. \
                                Yetkiliye teslim edilen cihazları "Not:" satırında belirt.""")
                        .faultExample("Demontaj ve montaj")
                        .serviceExample("""
                                1. Kattaki IBM depo çatı katına taşınmıştır.
                                Kamera sistemi -> 6 adet kamera montajı, kabin taşıma ve karşıya alma, \
                                kablolama
                                Alarm sistemi -> panel, siren, keypad, PIR ve kablolama
                                Kartlı geçiş -> 2 adet kartlı geçiş, kapı alarmı

                                Not: 2 adet kamera, 1 adet 2'li kartlı geçiş ve 1 adet kapı alarmı yetkili \
                                kişilere teslim edilmiştir.""")
                        .build(),

                ServiceFormTemplate.builder()
                        .nameTr("Sistem Kabineti Düzenlemesi")
                        .nameEn("System Cabinet Tidy-up")
                        .orderIndex(11)
                        .promptHint("""
                                Sistem kabinindeki NVR, switch vb. cihazların sökülüp kablo tesisatının \
                                düzenlenmesi ve cihaz bakımı. Teknisyen genelde çalışmanın kapsamını, \
                                öngörülen süreyi ve çalışma sırasında kayıtta kesinti yaşanıp \
                                yaşanmadığını söyler. Kesintisiz kayıt önemlidir, mutlaka belirt.""")
                        .faultExample("Sistem kabineti düzenlenmesi")
                        .serviceExample("""
                                Yapmış olduğumuz çalışmada sistem kabineti düzenlenmiş olup, çalışma \
                                sırasında yedek NVR'lar kayıt yapar durumda bırakılmış olup kesinti \
                                yaşanmamıştır. Sistem çalışır şekilde teslim edilmiştir.""")
                        .build(),

                ServiceFormTemplate.builder()
                        .nameTr("Keşif / Teklif")
                        .nameEn("Survey / Quotation")
                        .orderIndex(12)
                        .promptHint("""
                                Arıza giderilmeden yapılan keşif ziyareti. Teknisyen genelde tespit \
                                edilen eksikleri, kaç cihazın etkilendiğini, kayıt olup olmadığını ve \
                                teklif için gereken malzemeleri söyler. Gerekli malzemeleri \
                                "Teklif için gerekli malzemeler:" başlığı altında numaralı liste yaz.""")
                        .faultExample("Kamera arızası")
                        .serviceExample("""
                                Kurulu bulunan kamera sisteminin gümrük cihazına bağlı olan 24 nolu \
                                kanaldaki kamera çalışmamaktadır. İlgili kameranın kontrolleri \
                                yapıldığında kameranın hattının çalışmadığı saptanmıştır. O bölgede 5 adet \
                                kamera bulunmaktadır, hepsinin hatlarının değişimi gerekmektedir. Yetkili \
                                kişiler ile konuşulmuştur, teklif hazırlanıp verilecektir.

                                Teklif için gerekli malzemeler:
                                1- 8 port switch 1 adet
                                2- 500 m outdoor CAT6 kablo
                                3- 2 adet monitör""")
                        .build(),

                ServiceFormTemplate.builder()
                        .nameTr("Malzeme Alımı / Teslimi")
                        .nameEn("Material Pickup / Delivery")
                        .orderIndex(13)
                        .promptHint("""
                                Arıza değil; depodan veya müşteriden malzeme alınması ya da sahaya malzeme \
                                teslim edilmesi. Teknisyen genelde malzemenin nereden alındığını, hangi \
                                blok veya iş için alındığını, cinsini ve metrajını/adedini söyler. \
                                Malzemeleri mutlaka products içine yaz.""")
                        .faultExample("Teknikten alınan malzemeler")
                        .serviceExample("Malzemeler A Blok için alınmıştır.")
                        .build()
        ));

        logger.info("✅ Seeded default service form templates");
    }
}
