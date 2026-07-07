package com.sealo.domain.routine;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
// Spring Boot 4: MockMvc 자동설정이 webmvc 모듈로, Jackson은 3.x(tools.jackson)로 이동
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import tools.jackson.databind.ObjectMapper;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class RoutineApiTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    private static final String[] ALL_DAYS =
            java.util.Arrays.stream(DayOfWeek.values()).map(Enum::name).toArray(String[]::new);

    private String routineJson(String name) throws Exception {
        return objectMapper.writeValueAsString(Map.of(
                "name", name,
                "icon", "🚶",
                "alarmTime", "12:30",
                "days", ALL_DAYS
        ));
    }

    private long createRoutine(String name) throws Exception {
        String body = mockMvc.perform(post("/api/routines")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(routineJson(name)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("id").asLong();
    }

    @Test
    void 루틴을_생성하고_조회한다() throws Exception {
        createRoutine("점심 산책");

        mockMvc.perform(get("/api/routines"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("점심 산책"))
                .andExpect(jsonPath("$[0].alarmEnabled").value(true));
    }

    @Test
    void 루틴을_수정한다() throws Exception {
        long id = createRoutine("점심 산책");

        String updated = objectMapper.writeValueAsString(Map.of(
                "name", "저녁 산책",
                "icon", "🌙",
                "alarmTime", "20:00",
                "days", new String[]{"MONDAY", "WEDNESDAY"},
                "alarmEnabled", false
        ));

        mockMvc.perform(put("/api/routines/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updated))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("저녁 산책"))
                .andExpect(jsonPath("$.alarmEnabled").value(false));
    }

    @Test
    void 루틴을_삭제하면_목록에서_사라진다() throws Exception {
        long id = createRoutine("점심 산책");

        mockMvc.perform(delete("/api/routines/" + id))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/routines"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void 다른_회원의_루틴은_수정할_수_없다() throws Exception {
        long id = createRoutine("점심 산책");

        mockMvc.perform(put("/api/routines/" + id)
                        .header("X-Member-Id", "999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(routineJson("탈취 시도")))
                .andExpect(status().isNotFound());
    }

    @Test
    void 도장을_찍으면_조개를_받고_오늘의_루틴이_완료로_표시된다() throws Exception {
        long id = createRoutine("점심 산책");

        mockMvc.perform(post("/api/routines/" + id + "/stamp"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.earnedShells").value(10))
                .andExpect(jsonPath("$.shellBalance").value(10));

        mockMvc.perform(get("/api/routines/today"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].completed").value(true));
    }

    @Test
    void 같은_날_같은_루틴에_도장을_두_번_찍을_수_없다() throws Exception {
        long id = createRoutine("점심 산책");

        mockMvc.perform(post("/api/routines/" + id + "/stamp"))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/routines/" + id + "/stamp"))
                .andExpect(status().isConflict());
    }

    @Test
    void 캘린더는_날짜별_도장_수를_반환한다() throws Exception {
        long id = createRoutine("점심 산책");
        mockMvc.perform(post("/api/routines/" + id + "/stamp"))
                .andExpect(status().isCreated());

        String month = LocalDate.now().toString().substring(0, 7);
        mockMvc.perform(get("/api/stamps/calendar").param("month", month))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].count").value(1));
    }

    @Test
    void 오늘_도장을_찍으면_스트릭이_1이_된다() throws Exception {
        mockMvc.perform(get("/api/stamps/streak"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.current").value(0));

        long id = createRoutine("점심 산책");
        mockMvc.perform(post("/api/routines/" + id + "/stamp"))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/stamps/streak"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.current").value(1));
    }

    @Test
    void 이름이_비어있으면_400() throws Exception {
        String invalid = objectMapper.writeValueAsString(Map.of(
                "name", "",
                "icon", "🚶",
                "alarmTime", "12:30",
                "days", ALL_DAYS
        ));

        mockMvc.perform(post("/api/routines")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalid))
                .andExpect(status().isBadRequest());
    }
}
