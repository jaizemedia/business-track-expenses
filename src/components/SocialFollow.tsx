import Image from 'next/image';

const ExecutiveBoard: React.FC = () => {
  const leaders = [
    {
      name: "Rev. Edmund Akyea-Mensah",
      title: "Founder & President",
      image: "leader1.jpg", // Replace with actual image paths
      bio: `The Rt. Rev. Edmund Akyea-Mensah is the Regional Bishop of the Apostolic Pastoral Congress for the North of England and a Member of the Executive Board. He sits on the Congress Synod and has three Dioceses (thus far) in his Region, each headed by a Bishop Ordinary. About 200 Priests from the inception of this congress so far have been ordained and licensed, with some of them still serving under these Bishops in "the North". Currently the congress is looking to expand the Diocesan presence in the northern part of England.
Rt. Rev. Edmund Akyea-Mensah is Bishop of Command Prayer Centre Ministries Int. He also serves on the Chaplaincy Board of Trustees for Manchester International Airport. He is a Member of Evangelical Alliance U.K., and an Executive Elder of the Upperoom Ministers Forum where he has served as President for four consecutive terms. Rt. Rev. Edmund Akyea-Mensah is a Member of the Presidents of Greater Manchester Churches Together, which is made up of leaders representing different church denominations in the wider conurbation. He is also a member of Greater Manchester Faith Community Leaders U.K., and a member of the Pentecostal Community Association United Kingdom; referred to as PCA.
In 2013 he was conferred an Honorary Doctorate Decree in Divinity by the American Bible University in Florida US.
Rt. Rev. Edmund Akyea-Mensah is affiliated with several churches and other Christian Ministries in Switzerland, Ghana, parts of Africa and the United States of America.
He is happily married to Joyce Akyea-Mensah, a nursing professional, as well as an Educationist. They live in Manchester with their daughter and son.`,
    },
    {
      name: "Pastor Dapo Benzoe",
      title: "South Manchester",
      image: "/leader2.jpg",
      bio: "Pastor Dapo has an Apostolic calling to raise up sons of God who will know their identity in Christ, be transformed into the image of Christ and become vessels for the manifestation of the kingdom of Christ on this earth to fulfil Romans 8:19. Pastor Dapo Benzoe has served the Lord in the World Harvest Christian Centre for many years as a Pastor/Teacher of the Word of God and National Overseer over the Branches of the ministry in the United Kingdom and is currently serving the Body of Christ in the ‘New Man Global Network’, a ministry the Lord recently started through him in South Manchester.",
    },
    {
      name: "Apostle Dr. Solomon Oduro",
      title: "Royal Victory Family Church International",
      image: "/leader3.jpg",
      bio: "Apostle Dr. Solomon Oduro is a seasoned and dynamic teacher of the Word and an evangelist with deep prophetic insight. Having laboured for over 24 years in the Lord&#39;s Vineyard, he has established himself as a prominent figure in the spiritual community. Apostle Dr. Solomon Oduro serves as the Head Pastor and Founder of Royal Victory Family Church International, headquartered in Kwabenya with branches in Ashalaja, Ablekuma, Koforidua in Ghana as well as 2 international Branches situated in Liberia and in the UK. Additionally, he presides over Asetenapa Mpaebo Denden, a non- denominational prayer organization boasting over 10,000 members in Ghana and 2,000 globally. Apostle Solomon Oduro’s passion for spreading the Gospel of Christ extends beyond Ghana and Africa, as he has travelled the world with the Gospel and has so far toured Germany, Canada, Ireland, Belgium, 16 States of the USA, and more spreading the Gospel and Teachings of our Lord Jesus Christ and carrying out Healing and Deliverance, and prophetic works. He pioneered the ministry, Liberating the Liberators, aimed at delivering pastors and church workers from hidden sins and secret challenges. To nurture kingdom-minded individuals, Apostle Dr. Oduro established ROSHEI (Royal Shepherd Bible Institute) in 2016. Driven by compassion, he initiated the Royal Save Life Campaign to support the less privileged. The Ghana Gospel Legends Foundation, founded by Apostle Dr. Oduro, honors retired spiritual leaders who pioneered revivals in Ghana, providing a platform for intergenerational knowledge transfer. Apostle Dr. Oduro&#39;s leadership anointing has spawned the Global Sons and Daughters Impact Movement, empowering over 200 influential individuals worldwide. His vision focuses on equipping the next generation of global leaders. He is the Executive Producer of Tokuro Ketewa, a radio show that seeks to unravel the mysteries of the human and Christian life, and Asetenapa Mmre, a none denominational dawn broadcast, which airs on airs on Original 93.9. Beyond ministry, Apostle Dr. Oduro excels as the CEO Sokolight Company, Hair Fire beauty and Grooming salon and a Contractor and Managing Director of Tinxin Construction and Real Estate Company Ltd. A firm believer in lifelong learning, Apostle Dr. Oduro pursues a Communication Studies degree at Wisconsin University College, Accra. He also hosts Asetenapa Mmere on Original 91.9 FM, leading morning devotionMonday-Friday, 5-7 am. He is a family man with two daughters and a son: Valentina, Alexina and Joel.",
    },
  ];

  return (
    <section id="executive-board" className="py-16 bg-gray-50">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-12">
          The Executive Board of Leadership
        </h2>
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3">
          {leaders.map((leader, index) => (
            <div key={index} className="bg-white rounded-xl shadow-md p-6 text-center">
              <Image
                src={leader.image.startsWith('/') ? leader.image : `/${leader.image}`}
                alt={leader.name}
                width={112}
                height={112}
                className="w-28 h-28 mx-auto rounded-full object-cover shadow mb-4"
              />
              <h3 className="text-xl font-semibold text-gray-900">{leader.name}</h3>
              <p className="text-sm text-indigo-600 font-medium">{leader.title}</p>
              <p className="text-gray-600 text-sm mt-2">{leader.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExecutiveBoard;
